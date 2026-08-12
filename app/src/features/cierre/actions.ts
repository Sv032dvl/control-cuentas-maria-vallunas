"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { todayISO } from "@/lib/format";
import { cierreFullSchema, cierreDraftSchema, calcTotales, calcPizza, PORCIONES_POR_RUEDA, type CierreFormValues } from "./schema";
import { loadVentasLoyverse, type LoyverseData } from "./loaders";

export type GuardarResult =
  | { ok: true; cierreId: string; cuadrado: boolean; diferencia: number }
  | { ok: false; error: string };

/**
 * Guarda el cierre del día completo:
 *  1. Upsert del registro padre (cierres_diarios) por (fecha, empleado).
 *  2. Borra todas las líneas hijas y reinserta — el formulario es la fuente de verdad.
 *  3. Recalcula totales y los persiste en el padre.
 *
 * Si `cerrar` es true, marca estado='cerrado'. Si no, queda 'abierto' (borrador).
 */
export async function guardarCierre(
  raw: CierreFormValues,
  cerrar: boolean,
  fecha?: string,
): Promise<GuardarResult> {
  const parsed = cierreFullSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;

  // Auth check con cliente normal (respeta RLS para verificar sesión)
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) return { ok: false, error: "Sesión no válida" };

  // Admin client para operaciones DB (bypasa RLS)
  const supabase = createAdminClient();

  const fechaFinal = fecha ?? todayISO();
  const t = calcTotales(data);

  // 1. Upsert cierre padre
  const { data: cierre, error: upErr } = await supabase
    .from("cierres_diarios")
    .upsert(
      {
        fecha: fechaFinal,
        empleado_id: user.id,
        base_inicial: data.base_inicial,
        base_billetes: data.base_billetes,
        base_monedas: data.base_monedas,
        base_editado: data.base_editado,
        ventas_tpv_total: t.ventasTpv,
        ingresos_digitales_total: t.digital,
        efectivo_contado: t.arqueo,
        arqueo_monedas: data.arqueo_monedas ?? 0,
        efectivo_esperado: t.efectivoEsperado,
        diferencia: t.diferencia,
        cuadrado: t.cuadrado,
        nota_diferencia: data.nota_diferencia || null,
        estado: cerrar ? "cerrado" : "abierto",
      },
      { onConflict: "fecha,empleado_id" },
    )
    .select("id")
    .single();

  if (upErr || !cierre) {
    return { ok: false, error: upErr?.message ?? "No se pudo guardar el cierre" };
  }
  const cierreId = cierre.id;

  // 2. Borrar hijos previos
  await Promise.all([
    supabase.from("ventas_producto").delete().eq("cierre_id", cierreId),
    supabase.from("ingresos_digitales").delete().eq("cierre_id", cierreId),
    supabase.from("egresos").delete().eq("cierre_id", cierreId),
    supabase.from("arqueo_billetes").delete().eq("cierre_id", cierreId),
  ]);

  // 3. Insertar hijos nuevos (solo los que tienen datos)
  const ventasRows = data.ventas
    .filter((v) => v.cantidad > 0)
    .map((v) => ({
      cierre_id: cierreId,
      producto_id: v.producto_id,
      cantidad: v.cantidad,
      precio_unitario: v.precio_unitario,
    }));

  const digRows = data.digitales
    .filter((d) => d.monto > 0)
    .map((d) => ({
      cierre_id: cierreId,
      metodo: d.metodo,
      monto: d.monto,
      descripcion: d.descripcion || null,
    }));

  const egrRows = data.egresos
    .filter((e) => e.monto > 0)
    .map((e) => ({
      cierre_id: cierreId,
      concepto: e.concepto,
      categoria_id: e.categoria_id,
      unidad_id: e.unidad_id,
      monto: e.monto,
      metodo_pago: "efectivo" as const,
    }));

  const arqRows = data.arqueo
    .filter((a) => a.cantidad > 0)
    .map((a) => ({
      cierre_id: cierreId,
      denominacion_id: a.denominacion_id,
      cantidad: a.cantidad,
      subtotal: a.cantidad * a.valor,
    }));

  const inserts = await Promise.all([
    ventasRows.length
      ? supabase.from("ventas_producto").insert(ventasRows)
      : Promise.resolve({ error: null }),
    digRows.length
      ? supabase.from("ingresos_digitales").insert(digRows)
      : Promise.resolve({ error: null }),
    egrRows.length
      ? supabase.from("egresos").insert(egrRows)
      : Promise.resolve({ error: null }),
    arqRows.length
      ? supabase.from("arqueo_billetes").insert(arqRows)
      : Promise.resolve({ error: null }),
  ]);

  const childErr = inserts.find((r) => r.error)?.error;
  if (childErr) {
    return { ok: false, error: `Error al guardar líneas: ${childErr.message}` };
  }

  // 4. Upsert inventario de pizza (tabla independiente, UNIQUE por fecha)
  const hasPizza =
    (data.pizza_ruedas_inicio ?? 0) > 0 ||
    (data.pizza_porciones_inicio ?? 0) > 0 ||
    (data.pizza_horneada ?? 0) > 0 ||
    (data.pizza_ruedas_final ?? 0) > 0 ||
    (data.pizza_porciones_final ?? 0) > 0;

  if (hasPizza) {
    const pz = calcPizza(data);
    // Calcular porciones vendidas de productos de pizzería desde las ventas del cierre
    const { data: pizzaProds } = await supabase
      .from("productos")
      .select("id, multiplicador")
      .eq("unidad_id", "75340370-d308-44ff-9cce-74bcfc0358ed"); // Pizzería
    const pizzaMap = new Map((pizzaProds ?? []).map((p) => [p.id, p.multiplicador ?? 1]));
    const porcionesVendidas = data.ventas
      .filter((v) => pizzaMap.has(v.producto_id))
      .reduce((acc, v) => acc + v.cantidad * (pizzaMap.get(v.producto_id) ?? 1), 0);

    await supabase.from("inventario_pizza").upsert(
      {
        fecha: fechaFinal,
        empleado_id: user.id,
        ruedas_inicio: data.pizza_ruedas_inicio,
        porciones_inicio: data.pizza_porciones_inicio,
        horneada: data.pizza_horneada,
        ruedas_final: data.pizza_ruedas_final,
        porciones_final: data.pizza_porciones_final,
        porciones_vendidas_tpv: porcionesVendidas,
        diferencia: pz.consumidas - porcionesVendidas,
        notas: data.pizza_notas || null,
      },
      { onConflict: "fecha" },
    );
  }

  revalidatePath("/cierre");
  revalidatePath("/dashboard");

  return {
    ok: true,
    cierreId,
    cuadrado: t.cuadrado,
    diferencia: t.diferencia,
  };
}

// ─── Auto-save de borradores ────────────────────────────────────────────────

export type DraftResult =
  | { ok: true; cierreId: string; savedAt: string }
  | { ok: false; error: string };

/**
 * Guarda un borrador parcial del cierre (auto-save).
 * Usa validación relajada (cierreDraftSchema) para aceptar datos incompletos.
 * NO llama revalidatePath para evitar re-renders durante auto-save.
 */
export async function guardarCierreDraft(
  raw: unknown,
  fecha: string,
): Promise<DraftResult> {
  const parsed = cierreDraftSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;

  // Auth check con cliente normal
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) return { ok: false, error: "Sesión no válida" };

  // Admin client para operaciones DB (bypasa RLS)
  const supabase = createAdminClient();

  // Verificar que no esté cerrado
  const { data: existing } = await supabase
    .from("cierres_diarios")
    .select("id, estado")
    .eq("fecha", fecha)
    .eq("empleado_id", user.id)
    .maybeSingle();

  if (existing?.estado === "cerrado") {
    return { ok: false, error: "Este cierre ya está cerrado" };
  }

  const t = calcTotales(data as Partial<CierreFormValues>);

  // Upsert cierre padre
  const { data: cierre, error: upErr } = await supabase
    .from("cierres_diarios")
    .upsert(
      {
        fecha,
        empleado_id: user.id,
        base_inicial: data.base_inicial,
        base_billetes: data.base_billetes,
        base_monedas: data.base_monedas,
        base_editado: data.base_editado,
        ventas_tpv_total: t.ventasTpv,
        ingresos_digitales_total: t.digital,
        efectivo_contado: t.arqueo,
        arqueo_monedas: data.arqueo_monedas ?? 0,
        efectivo_esperado: t.efectivoEsperado,
        diferencia: t.diferencia,
        cuadrado: t.cuadrado,
        nota_diferencia: data.nota_diferencia || null,
        estado: "abierto",
      },
      { onConflict: "fecha,empleado_id" },
    )
    .select("id")
    .single();

  if (upErr || !cierre) {
    return { ok: false, error: upErr?.message ?? "No se pudo guardar el borrador" };
  }
  const cierreId = cierre.id;

  // Preparar filas hijas — filtrar filas incompletas
  const ventasRows = data.ventas
    .filter((v) => v.producto_id && v.cantidad > 0)
    .map((v) => ({
      cierre_id: cierreId,
      producto_id: v.producto_id,
      cantidad: v.cantidad,
      precio_unitario: v.precio_unitario,
    }));

  const digRows = data.digitales
    .filter((d) => d.monto > 0)
    .map((d) => ({
      cierre_id: cierreId,
      metodo: d.metodo,
      monto: d.monto,
      descripcion: d.descripcion || null,
    }));

  const egrRows = data.egresos
    .filter((e) => (e.concepto.length > 0 || e.monto > 0) && e.categoria_id && e.unidad_id)
    .map((e) => ({
      cierre_id: cierreId,
      concepto: e.concepto || "—",
      categoria_id: e.categoria_id,
      unidad_id: e.unidad_id,
      monto: e.monto || 0,
      metodo_pago: (e.metodo_pago || "efectivo") as "efectivo" | "transferencia",
    }));

  const arqRows = data.arqueo
    .filter((a) => a.cantidad > 0)
    .map((a) => ({
      cierre_id: cierreId,
      denominacion_id: a.denominacion_id,
      cantidad: a.cantidad,
      subtotal: a.cantidad * a.valor,
    }));

  // Insert-before-delete: insertar primero, verificar éxito, luego borrar viejos.
  // Esto evita pérdida de datos si el insert falla.
  const inserts = await Promise.all([
    ventasRows.length
      ? supabase.from("ventas_producto").insert(ventasRows).select("id")
      : Promise.resolve({ data: [] as { id: string }[], error: null }),
    digRows.length
      ? supabase.from("ingresos_digitales").insert(digRows).select("id")
      : Promise.resolve({ data: [] as { id: string }[], error: null }),
    egrRows.length
      ? supabase.from("egresos").insert(egrRows).select("id")
      : Promise.resolve({ data: [] as { id: string }[], error: null }),
    arqRows.length
      ? supabase.from("arqueo_billetes").insert(arqRows).select("id")
      : Promise.resolve({ data: [] as { id: string }[], error: null }),
  ]);

  const insertFailed = inserts.some((r) => r.error);
  if (insertFailed) {
    // Rollback: borrar las filas recién insertadas para no tener duplicados
    const newVentaIds = (inserts[0].data ?? []).map((r) => r.id);
    const newDigIds = (inserts[1].data ?? []).map((r) => r.id);
    const newEgrIds = (inserts[2].data ?? []).map((r) => r.id);
    const newArqIds = (inserts[3].data ?? []).map((r) => r.id);
    await Promise.all([
      newVentaIds.length ? supabase.from("ventas_producto").delete().in("id", newVentaIds) : null,
      newDigIds.length ? supabase.from("ingresos_digitales").delete().in("id", newDigIds) : null,
      newEgrIds.length ? supabase.from("egresos").delete().in("id", newEgrIds) : null,
      newArqIds.length ? supabase.from("arqueo_billetes").delete().in("id", newArqIds) : null,
    ]);
    return { ok: false, error: "Error al guardar líneas del borrador" };
  }

  // Éxito: borrar filas viejas (las que NO son las recién insertadas)
  const newVentaIds = (inserts[0].data ?? []).map((r) => r.id);
  const newDigIds = (inserts[1].data ?? []).map((r) => r.id);
  const newEgrIds = (inserts[2].data ?? []).map((r) => r.id);
  const newArqIds = (inserts[3].data ?? []).map((r) => r.id);
  await Promise.all([
    supabase.from("ventas_producto").delete().eq("cierre_id", cierreId).not("id", "in", `(${newVentaIds.join(",")})`),
    supabase.from("ingresos_digitales").delete().eq("cierre_id", cierreId).not("id", "in", `(${newDigIds.join(",")})`),
    supabase.from("egresos").delete().eq("cierre_id", cierreId).not("id", "in", `(${newEgrIds.join(",")})`),
    supabase.from("arqueo_billetes").delete().eq("cierre_id", cierreId).not("id", "in", `(${newArqIds.join(",")})`),
  ]);

  // Upsert inventario de pizza (draft — sin cruce de vendidas)
  const hasPizzaDraft =
    (data.pizza_ruedas_inicio ?? 0) > 0 ||
    (data.pizza_porciones_inicio ?? 0) > 0 ||
    (data.pizza_horneada ?? 0) > 0 ||
    (data.pizza_ruedas_final ?? 0) > 0 ||
    (data.pizza_porciones_final ?? 0) > 0;

  if (hasPizzaDraft) {
    await supabase.from("inventario_pizza").upsert(
      {
        fecha,
        empleado_id: user.id,
        ruedas_inicio: data.pizza_ruedas_inicio,
        porciones_inicio: data.pizza_porciones_inicio,
        horneada: data.pizza_horneada,
        ruedas_final: data.pizza_ruedas_final,
        porciones_final: data.pizza_porciones_final,
        notas: data.pizza_notas || null,
      },
      { onConflict: "fecha" },
    );
  }

  return { ok: true, cierreId, savedAt: new Date().toISOString() };
}

/**
 * Importa ventas y pagos digitales desde Loyverse para una fecha dada.
 * Usada on-demand desde el step de ventas (botón Importar / Actualizar).
 */
export async function importarVentasLoyverse(
  fecha: string,
): Promise<LoyverseData> {
  return loadVentasLoyverse(fecha);
}

export async function reorderProductosAction(
  orden: { id: string; orden: number }[],
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createAdminClient();

  for (const item of orden) {
    const { error } = await supabase
      .from("productos")
      .update({ orden: item.orden })
      .eq("id", item.id);
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/cierre");
  return { ok: true };
}
