"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/format";
import { facturaSchema, type FacturaFormValues } from "./schema";

type Result = { ok: true } | { ok: false; error: string };

export async function crearFactura(raw: FacturaFormValues): Promise<Result> {
  const parsed = facturaSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const d = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("facturas_proveedor").insert({
    proveedor: d.proveedor,
    numero_factura: d.numero_factura || null,
    fecha: d.fecha,
    fecha_vencimiento: d.fecha_vencimiento || null,
    monto: d.monto,
    metodo_pago: d.metodo_pago || null,
    nota: d.nota || null,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/facturas");
  return { ok: true };
}

export async function editarFactura(
  id: string,
  raw: FacturaFormValues,
): Promise<Result> {
  const parsed = facturaSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const d = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("facturas_proveedor")
    .update({
      proveedor: d.proveedor,
      numero_factura: d.numero_factura || null,
      fecha: d.fecha,
      fecha_vencimiento: d.fecha_vencimiento || null,
      monto: d.monto,
      metodo_pago: d.metodo_pago || null,
      nota: d.nota || null,
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/facturas");
  return { ok: true };
}

export async function marcarPagada(
  id: string,
  metodo_pago: "efectivo" | "transferencia",
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("facturas_proveedor")
    .update({
      estado: "pagada",
      metodo_pago,
      fecha_pago: todayISO(),
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/facturas");
  return { ok: true };
}

export async function eliminarFactura(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("facturas_proveedor")
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/facturas");
  return { ok: true };
}
