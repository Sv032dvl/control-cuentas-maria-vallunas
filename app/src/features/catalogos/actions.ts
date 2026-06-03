"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/supabase/session";

// ─── Shared types ────────────────────────────────────────────────────────────

export type ActionResult = {
  success?: boolean;
  error?: string;
  message?: string;
};

const CATALOGOS_PATH = "/dashboard/catalogos";

// ─── Schemas ─────────────────────────────────────────────────────────────────

const ProductoSchema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres").max(80, "Máximo 80 caracteres"),
  precio: z.coerce.number().min(0, "El precio debe ser >= 0"),
  unidad_id: z.string().uuid("Selecciona una unidad de negocio"),
});

const CategoriaSchema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres").max(50, "Máximo 50 caracteres"),
});

const UnidadSchema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres").max(50, "Máximo 50 caracteres"),
});

const DenominacionSchema = z.object({
  valor: z.coerce.number().int("Debe ser un entero").positive("Debe ser mayor a 0"),
});

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCTOS
// ═══════════════════════════════════════════════════════════════════════════════

export async function crearProductoAction(
  formData: FormData,
): Promise<ActionResult> {
  await requireRole("admin");

  const parsed = ProductoSchema.safeParse({
    nombre: formData.get("nombre"),
    precio: formData.get("precio"),
    unidad_id: formData.get("unidad_id"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("productos").insert(parsed.data);

  if (error) {
    console.error("[crearProducto]", error);
    if (error.code === "23505") return { error: "Ya existe un producto con ese nombre" };
    return { error: "Error al crear el producto" };
  }

  revalidatePath(CATALOGOS_PATH);
  return { success: true, message: `Producto "${parsed.data.nombre}" creado` };
}

export async function editarProductoAction(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireRole("admin");

  const idParsed = z.string().uuid().safeParse(id);
  if (!idParsed.success) return { error: "ID inválido" };

  const parsed = ProductoSchema.safeParse({
    nombre: formData.get("nombre"),
    precio: formData.get("precio"),
    unidad_id: formData.get("unidad_id"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("productos")
    .update(parsed.data)
    .eq("id", idParsed.data);

  if (error) {
    console.error("[editarProducto]", error);
    if (error.code === "23505") return { error: "Ya existe un producto con ese nombre" };
    return { error: "Error al actualizar el producto" };
  }

  revalidatePath(CATALOGOS_PATH);
  return { success: true, message: `Producto "${parsed.data.nombre}" actualizado` };
}

export async function toggleProductoActivoAction(
  id: string,
  activo: boolean,
): Promise<ActionResult> {
  await requireRole("admin");

  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return { error: "ID inválido" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("productos")
    .update({ activo })
    .eq("id", parsed.data);

  if (error) {
    console.error("[toggleProducto]", error);
    return { error: "Error al actualizar el producto" };
  }

  revalidatePath(CATALOGOS_PATH);
  return { success: true, message: activo ? "Producto activado" : "Producto desactivado" };
}

export async function eliminarProductoAction(
  id: string,
): Promise<ActionResult> {
  await requireRole("admin");

  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return { error: "ID inválido" };

  const supabase = await createClient();
  const { error } = await supabase.from("productos").delete().eq("id", parsed.data);

  if (error) {
    console.error("[eliminarProducto]", error);
    if (error.code === "23503") return { error: "No se puede eliminar: tiene ventas asociadas" };
    return { error: "Error al eliminar el producto" };
  }

  revalidatePath(CATALOGOS_PATH);
  return { success: true, message: "Producto eliminado" };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORÍAS DE EGRESO
// ═══════════════════════════════════════════════════════════════════════════════

export async function crearCategoriaAction(
  formData: FormData,
): Promise<ActionResult> {
  await requireRole("admin");

  const parsed = CategoriaSchema.safeParse({
    nombre: formData.get("nombre"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("categorias_egreso").insert(parsed.data);

  if (error) {
    console.error("[crearCategoria]", error);
    if (error.code === "23505") return { error: "Ya existe una categoría con ese nombre" };
    return { error: "Error al crear la categoría" };
  }

  revalidatePath(CATALOGOS_PATH);
  return { success: true, message: `Categoría "${parsed.data.nombre}" creada` };
}

export async function editarCategoriaAction(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireRole("admin");

  const idParsed = z.string().uuid().safeParse(id);
  if (!idParsed.success) return { error: "ID inválido" };

  const parsed = CategoriaSchema.safeParse({
    nombre: formData.get("nombre"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("categorias_egreso")
    .update(parsed.data)
    .eq("id", idParsed.data);

  if (error) {
    console.error("[editarCategoria]", error);
    if (error.code === "23505") return { error: "Ya existe una categoría con ese nombre" };
    return { error: "Error al actualizar la categoría" };
  }

  revalidatePath(CATALOGOS_PATH);
  return { success: true, message: `Categoría "${parsed.data.nombre}" actualizada` };
}

export async function toggleCategoriaActivaAction(
  id: string,
  activo: boolean,
): Promise<ActionResult> {
  await requireRole("admin");

  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return { error: "ID inválido" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("categorias_egreso")
    .update({ activo })
    .eq("id", parsed.data);

  if (error) {
    console.error("[toggleCategoria]", error);
    return { error: "Error al actualizar la categoría" };
  }

  revalidatePath(CATALOGOS_PATH);
  return { success: true, message: activo ? "Categoría activada" : "Categoría desactivada" };
}

export async function eliminarCategoriaAction(
  id: string,
): Promise<ActionResult> {
  await requireRole("admin");

  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return { error: "ID inválido" };

  const supabase = await createClient();

  // Check for associated egresos
  const { count } = await supabase
    .from("egresos")
    .select("id", { count: "exact", head: true })
    .eq("categoria_id", parsed.data);

  if (count && count > 0) {
    return { error: `No se puede eliminar: tiene ${count} egreso(s) asociado(s). Desactívala en su lugar.` };
  }

  const { error } = await supabase
    .from("categorias_egreso")
    .delete()
    .eq("id", parsed.data);

  if (error) {
    console.error("[eliminarCategoria]", error);
    if (error.code === "23503") return { error: "No se puede eliminar: tiene egresos asociados" };
    return { error: "Error al eliminar la categoría" };
  }

  revalidatePath(CATALOGOS_PATH);
  return { success: true, message: "Categoría eliminada" };
}

// ═══════════════════════════════════════════════════════════════════════════════
// UNIDADES DE NEGOCIO
// ═══════════════════════════════════════════════════════════════════════════════

export async function crearUnidadAction(
  formData: FormData,
): Promise<ActionResult> {
  await requireRole("admin");

  const parsed = UnidadSchema.safeParse({
    nombre: formData.get("nombre"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("unidades_negocio").insert(parsed.data);

  if (error) {
    console.error("[crearUnidad]", error);
    if (error.code === "23505") return { error: "Ya existe una unidad con ese nombre" };
    return { error: "Error al crear la unidad" };
  }

  revalidatePath(CATALOGOS_PATH);
  return { success: true, message: `Unidad "${parsed.data.nombre}" creada` };
}

export async function editarUnidadAction(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireRole("admin");

  const idParsed = z.string().uuid().safeParse(id);
  if (!idParsed.success) return { error: "ID inválido" };

  const parsed = UnidadSchema.safeParse({
    nombre: formData.get("nombre"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("unidades_negocio")
    .update(parsed.data)
    .eq("id", idParsed.data);

  if (error) {
    console.error("[editarUnidad]", error);
    if (error.code === "23505") return { error: "Ya existe una unidad con ese nombre" };
    return { error: "Error al actualizar la unidad" };
  }

  revalidatePath(CATALOGOS_PATH);
  return { success: true, message: `Unidad "${parsed.data.nombre}" actualizada` };
}

export async function toggleUnidadActivaAction(
  id: string,
  activo: boolean,
): Promise<ActionResult> {
  await requireRole("admin");

  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return { error: "ID inválido" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("unidades_negocio")
    .update({ activo })
    .eq("id", parsed.data);

  if (error) {
    console.error("[toggleUnidad]", error);
    return { error: "Error al actualizar la unidad" };
  }

  revalidatePath(CATALOGOS_PATH);
  return { success: true, message: activo ? "Unidad activada" : "Unidad desactivada" };
}

export async function eliminarUnidadAction(
  id: string,
  nombre: string,
): Promise<ActionResult> {
  await requireRole("admin");

  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return { error: "ID inválido" };

  // Protect "Compartido"
  if (nombre.toLowerCase() === "compartido") {
    return { error: "La unidad 'Compartido' no se puede eliminar" };
  }

  const supabase = await createClient();

  // Check for associated productos
  const { count } = await supabase
    .from("productos")
    .select("id", { count: "exact", head: true })
    .eq("unidad_id", parsed.data);

  if (count && count > 0) {
    return { error: `No se puede eliminar: tiene ${count} producto(s) asociado(s). Desactívala en su lugar.` };
  }

  const { error } = await supabase
    .from("unidades_negocio")
    .delete()
    .eq("id", parsed.data);

  if (error) {
    console.error("[eliminarUnidad]", error);
    if (error.code === "23503") return { error: "No se puede eliminar: tiene registros asociados" };
    return { error: "Error al eliminar la unidad" };
  }

  revalidatePath(CATALOGOS_PATH);
  return { success: true, message: "Unidad eliminada" };
}

// ═══════════════════════════════════════════════════════════════════════════════
// DENOMINACIONES DE BILLETE
// ═══════════════════════════════════════════════════════════════════════════════

export async function crearDenominacionAction(
  formData: FormData,
): Promise<ActionResult> {
  await requireRole("admin");

  const parsed = DenominacionSchema.safeParse({
    valor: formData.get("valor"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("denominaciones_billete").insert(parsed.data);

  if (error) {
    console.error("[crearDenominacion]", error);
    if (error.code === "23505") return { error: "Ya existe esa denominación" };
    return { error: "Error al crear la denominación" };
  }

  revalidatePath(CATALOGOS_PATH);
  return { success: true, message: `Denominación $${parsed.data.valor.toLocaleString("es-CO")} creada` };
}

export async function editarDenominacionAction(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireRole("admin");

  const idParsed = z.string().uuid().safeParse(id);
  if (!idParsed.success) return { error: "ID inválido" };

  const parsed = DenominacionSchema.safeParse({
    valor: formData.get("valor"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("denominaciones_billete")
    .update(parsed.data)
    .eq("id", idParsed.data);

  if (error) {
    console.error("[editarDenominacion]", error);
    if (error.code === "23505") return { error: "Ya existe esa denominación" };
    return { error: "Error al actualizar la denominación" };
  }

  revalidatePath(CATALOGOS_PATH);
  return { success: true, message: `Denominación actualizada` };
}

export async function toggleDenominacionActivaAction(
  id: string,
  activo: boolean,
): Promise<ActionResult> {
  await requireRole("admin");

  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return { error: "ID inválido" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("denominaciones_billete")
    .update({ activo })
    .eq("id", parsed.data);

  if (error) {
    console.error("[toggleDenominacion]", error);
    return { error: "Error al actualizar la denominación" };
  }

  revalidatePath(CATALOGOS_PATH);
  return { success: true, message: activo ? "Denominación activada" : "Denominación desactivada" };
}

export async function eliminarDenominacionAction(
  id: string,
): Promise<ActionResult> {
  await requireRole("admin");

  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return { error: "ID inválido" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("denominaciones_billete")
    .delete()
    .eq("id", parsed.data);

  if (error) {
    console.error("[eliminarDenominacion]", error);
    if (error.code === "23503") return { error: "No se puede eliminar: se usa en arqueos existentes" };
    return { error: "Error al eliminar la denominación" };
  }

  revalidatePath(CATALOGOS_PATH);
  return { success: true, message: "Denominación eliminada" };
}
