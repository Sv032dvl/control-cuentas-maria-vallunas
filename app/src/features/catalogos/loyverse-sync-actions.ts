"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/supabase/session";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  fetchLoyverseItems,
  fetchLoyverseCategories,
  getItemPrice,
} from "@/lib/loyverse";
import type { ActionResult } from "./actions";

const CATALOGOS_PATH = "/dashboard/catalogos";

// Mapeo de categoría Loyverse → unidad de negocio en Supabase
const CATEGORY_TO_UNIDAD: Record<string, string> = {
  // Loyverse category_id → Supabase unidad_id
  "e40eef27-7922-4f4b-8127-57ea6779371e": "22256f9f-9605-47d5-a788-4e42c28521e8", // Empanadas
  "8d8c5065-bed5-4ebe-be1a-3b6e5bad3987": "75340370-d308-44ff-9cce-74bcfc0358ed", // Pizza → Pizzería
  "d740df7c-8de6-40ef-bc00-fa11c8c9e2c3": "64752338-32f5-4068-957d-a8ef6952660b", // Bebidas
  "fd0af44c-7936-4a7c-8fc2-01fabff5bd05": "2eccfcb8-48bf-4d66-81d2-10a471ed1949", // Arepas
  "951ff08a-8779-477c-a658-77a447341062": "9abffc19-e2e5-4624-af0e-3c64cef76769", // Adiciones
  "ae99f307-689a-46fc-8b96-c6966e804799": "e6f795e1-1f10-48f4-98f0-1455294c91de", // Domicilios
};

// Unidad por defecto cuando no hay categoría mapeada
const DEFAULT_UNIDAD = "ac1d7864-f531-493f-a661-3a7c9609e1b2"; // Compartido

function resolveUnidad(categoryId: string | null): string {
  if (!categoryId) return DEFAULT_UNIDAD;
  return CATEGORY_TO_UNIDAD[categoryId] ?? DEFAULT_UNIDAD;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINCRONIZACIÓN INICIAL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Importa todos los productos de Loyverse por primera vez.
 * - Desactiva los productos existentes que no tengan loyverse_item_id
 * - Crea los productos de Loyverse con su loyverse_item_id
 */
export async function sincronizarConLoyverseAction(): Promise<ActionResult> {
  await requireRole("admin");

  try {
    const [items, categories] = await Promise.all([
      fetchLoyverseItems(),
      fetchLoyverseCategories(),
    ]);

    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
    const supabase = createAdminClient();

    // 1. Desactivar productos orientativos (sin loyverse_item_id)
    await supabase
      .from("productos")
      .update({ activo: false })
      .is("loyverse_item_id", null);

    // 2. Insertar/actualizar productos desde Loyverse
    let creados = 0;
    let actualizados = 0;

    for (const item of items) {
      const precio = getItemPrice(item);
      const unidadId = resolveUnidad(item.category_id);

      const { data: existing } = await supabase
        .from("productos")
        .select("id")
        .eq("loyverse_item_id", item.id)
        .maybeSingle();

      if (existing) {
        // Actualizar
        await supabase
          .from("productos")
          .update({
            nombre: item.item_name,
            precio,
            unidad_id: unidadId,
            activo: true,
          })
          .eq("id", existing.id);
        actualizados++;
      } else {
        // Crear
        await supabase.from("productos").insert({
          nombre: item.item_name,
          precio,
          unidad_id: unidadId,
          loyverse_item_id: item.id,
          activo: true,
        });
        creados++;
      }
    }

    revalidatePath(CATALOGOS_PATH);
    return {
      success: true,
      message: `Sincronización completada: ${creados} creados, ${actualizados} actualizados, ${items.length} productos de Loyverse en total.`,
    };
  } catch (err) {
    console.error("[sincronizarConLoyverse]", err);
    return {
      error: `Error al sincronizar: ${err instanceof Error ? err.message : "desconocido"}`,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DETECCIÓN DE CAMBIOS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Compara los productos de Loyverse con Supabase y detecta diferencias.
 * Los cambios se guardan en `sync_loyverse_pendientes` para que el admin los apruebe.
 */
export async function detectarCambiosLoyverseAction(): Promise<ActionResult> {
  await requireRole("admin");

  try {
    const [items, categories] = await Promise.all([
      fetchLoyverseItems(),
      fetchLoyverseCategories(),
    ]);

    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
    const supabase = createAdminClient();

    // Productos actuales en Supabase con loyverse_item_id
    const { data: productosDb } = await supabase
      .from("productos")
      .select("id, nombre, precio, loyverse_item_id, activo")
      .not("loyverse_item_id", "is", null);

    const dbMap = new Map(
      (productosDb ?? []).map((p) => [p.loyverse_item_id!, p]),
    );

    // Pendientes ya existentes (para no duplicar)
    const { data: pendientesExistentes } = await supabase
      .from("sync_loyverse_pendientes")
      .select("loyverse_item_id, tipo")
      .eq("estado", "pendiente");

    const pendienteSet = new Set(
      (pendientesExistentes ?? []).map(
        (p) => `${p.loyverse_item_id}:${p.tipo}`,
      ),
    );

    const pendientes: Array<{
      tipo: string;
      loyverse_item_id: string;
      nombre_loyverse: string;
      precio_loyverse: number;
      categoria_loyverse: string | null;
      nombre_actual: string | null;
      precio_actual: number | null;
      producto_id: string | null;
    }> = [];

    // Revisar items de Loyverse
    for (const item of items) {
      const precio = getItemPrice(item);
      const catName = item.category_id
        ? categoryMap.get(item.category_id) ?? null
        : null;
      const dbProduct = dbMap.get(item.id);

      if (!dbProduct) {
        // Producto nuevo
        if (!pendienteSet.has(`${item.id}:nuevo`)) {
          pendientes.push({
            tipo: "nuevo",
            loyverse_item_id: item.id,
            nombre_loyverse: item.item_name,
            precio_loyverse: precio,
            categoria_loyverse: catName,
            nombre_actual: null,
            precio_actual: null,
            producto_id: null,
          });
        }
      } else {
        // Precio cambió
        if (
          Math.abs(dbProduct.precio - precio) >= 1 &&
          !pendienteSet.has(`${item.id}:precio`)
        ) {
          pendientes.push({
            tipo: "precio",
            loyverse_item_id: item.id,
            nombre_loyverse: item.item_name,
            precio_loyverse: precio,
            categoria_loyverse: catName,
            nombre_actual: dbProduct.nombre,
            precio_actual: dbProduct.precio,
            producto_id: dbProduct.id,
          });
        }

        // Nombre cambió
        if (
          dbProduct.nombre !== item.item_name &&
          !pendienteSet.has(`${item.id}:nombre`)
        ) {
          pendientes.push({
            tipo: "nombre",
            loyverse_item_id: item.id,
            nombre_loyverse: item.item_name,
            precio_loyverse: precio,
            categoria_loyverse: catName,
            nombre_actual: dbProduct.nombre,
            precio_actual: dbProduct.precio,
            producto_id: dbProduct.id,
          });
        }

        // Marcar como visto
        dbMap.delete(item.id);
      }
    }

    // Productos en Supabase que ya no existen en Loyverse
    for (const [loyverseId, dbProduct] of dbMap) {
      if (dbProduct.activo && !pendienteSet.has(`${loyverseId}:eliminado`)) {
        pendientes.push({
          tipo: "eliminado",
          loyverse_item_id: loyverseId,
          nombre_loyverse: dbProduct.nombre,
          precio_loyverse: dbProduct.precio,
          categoria_loyverse: null,
          nombre_actual: dbProduct.nombre,
          precio_actual: dbProduct.precio,
          producto_id: dbProduct.id,
        });
      }
    }

    // Insertar pendientes
    if (pendientes.length > 0) {
      const { error } = await supabase
        .from("sync_loyverse_pendientes")
        .insert(pendientes);

      if (error) {
        console.error("[detectarCambios] insert error", error);
        return { error: "Error al guardar cambios detectados" };
      }
    }

    revalidatePath(CATALOGOS_PATH);
    return {
      success: true,
      message:
        pendientes.length > 0
          ? `Se detectaron ${pendientes.length} cambio(s) pendientes de aprobación.`
          : "Todo sincronizado. No se encontraron cambios nuevos.",
    };
  } catch (err) {
    console.error("[detectarCambiosLoyverse]", err);
    return {
      error: `Error al verificar: ${err instanceof Error ? err.message : "desconocido"}`,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// APROBAR / RECHAZAR
// ═══════════════════════════════════════════════════════════════════════════════

export async function aprobarCambioAction(
  pendienteId: string,
): Promise<ActionResult> {
  await requireRole("admin");

  const supabase = createAdminClient();

  const { data: pendiente, error: fetchErr } = await supabase
    .from("sync_loyverse_pendientes")
    .select("*")
    .eq("id", pendienteId)
    .eq("estado", "pendiente")
    .maybeSingle();

  if (fetchErr || !pendiente) {
    return { error: "Cambio pendiente no encontrado" };
  }

  try {
    switch (pendiente.tipo) {
      case "nuevo": {
        const unidadId = await resolveUnidadFromLoyverse(
          supabase,
          pendiente.loyverse_item_id,
        );
        await supabase.from("productos").insert({
          nombre: pendiente.nombre_loyverse,
          precio: pendiente.precio_loyverse,
          unidad_id: unidadId,
          loyverse_item_id: pendiente.loyverse_item_id,
          activo: true,
        });
        break;
      }

      case "precio": {
        if (!pendiente.producto_id) return { error: "Producto no encontrado" };
        await supabase
          .from("productos")
          .update({ precio: pendiente.precio_loyverse })
          .eq("id", pendiente.producto_id);
        break;
      }

      case "nombre": {
        if (!pendiente.producto_id) return { error: "Producto no encontrado" };
        await supabase
          .from("productos")
          .update({ nombre: pendiente.nombre_loyverse })
          .eq("id", pendiente.producto_id);
        break;
      }

      case "eliminado": {
        if (!pendiente.producto_id) return { error: "Producto no encontrado" };
        await supabase
          .from("productos")
          .update({ activo: false })
          .eq("id", pendiente.producto_id);
        break;
      }
    }

    // Marcar como aprobado
    await supabase
      .from("sync_loyverse_pendientes")
      .update({ estado: "aprobado", resuelto_at: new Date().toISOString() })
      .eq("id", pendienteId);

    revalidatePath(CATALOGOS_PATH);
    return { success: true, message: `Cambio aprobado: ${pendiente.tipo} — ${pendiente.nombre_loyverse}` };
  } catch (err) {
    console.error("[aprobarCambio]", err);
    return { error: "Error al aplicar el cambio" };
  }
}

export async function rechazarCambioAction(
  pendienteId: string,
): Promise<ActionResult> {
  await requireRole("admin");

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("sync_loyverse_pendientes")
    .update({ estado: "rechazado", resuelto_at: new Date().toISOString() })
    .eq("id", pendienteId)
    .eq("estado", "pendiente");

  if (error) {
    console.error("[rechazarCambio]", error);
    return { error: "Error al rechazar el cambio" };
  }

  revalidatePath(CATALOGOS_PATH);
  return { success: true, message: "Cambio rechazado" };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function resolveUnidadFromLoyverse(
  supabase: ReturnType<typeof createAdminClient>,
  loyverseItemId: string,
): Promise<string> {
  try {
    const items = await fetchLoyverseItems();
    const item = items.find((i) => i.id === loyverseItemId);
    if (item?.category_id) {
      return resolveUnidad(item.category_id);
    }
  } catch {
    // Si falla, usar la unidad por defecto
  }
  return DEFAULT_UNIDAD;
}
