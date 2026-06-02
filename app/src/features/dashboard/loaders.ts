/**
 * Cargadores server-side para el dashboard admin.
 */
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/format";

export type CuadreRow = {
  id: string;
  fecha: string;
  empleado_nombre: string | null;
  base_inicial: number;
  ventas_tpv_total: number;
  ingresos_digitales_total: number;
  egresos_efectivo_total: number;
  efectivo_arqueo: number;
  efectivo_esperado: number;
  diferencia: number;
  cuadrado: boolean;
  estado: string;
};

export type AlertaRow = {
  cierre_id: string;
  fecha: string;
  empleado: string | null;
  magnitud: number;
  detalle: string | null;
};

export async function loadCuadreUltimos(dias = 14): Promise<CuadreRow[]> {
  const supabase = await createClient();
  const desde = new Date();
  desde.setDate(desde.getDate() - dias);
  const desdeISO = desde.toISOString().slice(0, 10);

  const { data } = await supabase
    .from("v_cuadre_diario")
    .select("*")
    .gte("fecha", desdeISO)
    .order("fecha", { ascending: false });

  return (data ?? []).map((r) => ({
    id: r.id ?? "",
    fecha: r.fecha ?? "",
    empleado_nombre: r.empleado_nombre,
    base_inicial: Number(r.base_inicial ?? 0),
    ventas_tpv_total: Number(r.ventas_tpv_total ?? 0),
    ingresos_digitales_total: Number(r.ingresos_digitales_total ?? 0),
    egresos_efectivo_total: Number(r.egresos_efectivo_total ?? 0),
    efectivo_arqueo: Number(r.efectivo_arqueo ?? 0),
    efectivo_esperado: Number(r.efectivo_esperado ?? 0),
    diferencia: Number(r.diferencia ?? 0),
    cuadrado: Boolean(r.cuadrado),
    estado: String(r.estado ?? ""),
  }));
}

export async function loadCuadreHoy(): Promise<CuadreRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("v_cuadre_diario")
    .select("*")
    .eq("fecha", todayISO())
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id ?? "",
    fecha: data.fecha ?? "",
    empleado_nombre: data.empleado_nombre,
    base_inicial: Number(data.base_inicial ?? 0),
    ventas_tpv_total: Number(data.ventas_tpv_total ?? 0),
    ingresos_digitales_total: Number(data.ingresos_digitales_total ?? 0),
    egresos_efectivo_total: Number(data.egresos_efectivo_total ?? 0),
    efectivo_arqueo: Number(data.efectivo_arqueo ?? 0),
    efectivo_esperado: Number(data.efectivo_esperado ?? 0),
    diferencia: Number(data.diferencia ?? 0),
    cuadrado: Boolean(data.cuadrado),
    estado: String(data.estado ?? ""),
  };
}

export async function loadAlertas(limit = 10): Promise<AlertaRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("v_alertas_admin")
    .select("*")
    .limit(limit);
  return (data ?? []).map((r) => ({
    cierre_id: r.cierre_id ?? "",
    fecha: r.fecha ?? "",
    empleado: r.empleado,
    magnitud: Number(r.magnitud ?? 0),
    detalle: r.detalle,
  }));
}

export type RentabilidadRow = {
  fecha: string;
  unidad_nombre: string;
  ventas_directas: number;
  ingresos_totales: number;
  egresos_totales: number;
  rentabilidad_neta: number;
};

export async function loadRentabilidad(dias = 30): Promise<RentabilidadRow[]> {
  const supabase = await createClient();
  const desde = new Date();
  desde.setDate(desde.getDate() - dias);
  const desdeISO = desde.toISOString().slice(0, 10);

  const { data } = await supabase
    .from("v_rentabilidad_unidad")
    .select("*")
    .gte("fecha", desdeISO);

  return (data ?? []).map((r) => ({
    fecha: r.fecha ?? "",
    unidad_nombre: r.unidad_nombre ?? "",
    ventas_directas: Number(r.ventas_directas ?? 0),
    ingresos_totales: Number(r.ingresos_totales ?? 0),
    egresos_totales: Number(r.egresos_totales ?? 0),
    rentabilidad_neta: Number(r.rentabilidad_neta ?? 0),
  }));
}
