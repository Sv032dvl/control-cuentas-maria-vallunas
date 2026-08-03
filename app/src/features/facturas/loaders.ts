import { createClient } from "@/lib/supabase/server";
import type { Factura } from "./schema";

export async function loadFacturas(): Promise<Factura[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("facturas_proveedor")
    .select("*")
    .order("fecha", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((f) => ({
    ...f,
    monto: Number(f.monto),
  })) as Factura[];
}
