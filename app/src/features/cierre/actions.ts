"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/format";
import { cierreFullSchema, calcTotales, type CierreFormValues } from "./schema";

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
): Promise<GuardarResult> {
  const parsed = cierreFullSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión no válida" };

  const fecha = todayISO();
  const t = calcTotales(data);

  // 1. Upsert cierre padre
  const { data: cierre, error: upErr } = await supabase
    .from("cierres_diarios")
    .upsert(
      {
        fecha,
        empleado_id: user.id,
        base_inicial: data.base_inicial,
        ventas_tpv_total: t.ventasTpv,
        ingresos_digitales_total: t.digital,
        efectivo_contado: t.arqueo,
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
      metodo_pago: e.metodo_pago,
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

  revalidatePath("/cierre");
  revalidatePath("/dashboard");

  return {
    ok: true,
    cierreId,
    cuadrado: t.cuadrado,
    diferencia: t.diferencia,
  };
}
