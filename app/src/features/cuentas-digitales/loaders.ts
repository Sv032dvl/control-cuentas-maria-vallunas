import { createClient } from "@/lib/supabase/server";

export type MovimientoCuenta = {
  cierre_id: string;
  fecha: string;
  cuenta_id: string;
  cuenta_nombre: string;
  propietario: number | null;
  monto: number;
  descripcion: string | null;
};

export type ResumenCuenta = {
  cuenta_id: string;
  cuenta_nombre: string;
  propietario: number | null;
  activo: boolean;
  total: number;
  movimientos: number;
};

export type AuditoriaDigital = {
  movimientos: MovimientoCuenta[];
  resumen: ResumenCuenta[];
  totalPorDueno: { 1: number; 2: number; sinDueno: number };
};

/**
 * Movimientos de las cuentas digitales en una ventana de días.
 *
 * `ingresos_digitales` no tiene fecha propia: la fecha vive en el cierre al
 * que pertenece, así que hay que unir por `cierre_id`. Por eso el filtro de
 * rango se aplica sobre la fecha del cierre, no sobre el ingreso.
 */
export async function loadAuditoriaDigital(dias = 30): Promise<AuditoriaDigital> {
  const supabase = await createClient();

  const desde = new Date();
  desde.setDate(desde.getDate() - dias);
  const desdeISO = desde.toISOString().slice(0, 10);

  const [{ data: ingresos, error }, { data: cuentas }] = await Promise.all([
    supabase
      .from("ingresos_digitales")
      .select(
        "cierre_id, monto, descripcion, cuentas_digitales(id, nombre, propietario), cierres_diarios!inner(fecha)",
      )
      .gte("cierres_diarios.fecha", desdeISO),
    supabase
      .from("cuentas_digitales")
      .select("id, nombre, propietario, activo")
      .order("propietario", { nullsFirst: false })
      .order("nombre"),
  ]);

  if (error) console.error("[loadAuditoriaDigital]", error);

  const movimientos: MovimientoCuenta[] = (ingresos ?? []).map((r) => {
    const cuenta = Array.isArray(r.cuentas_digitales)
      ? r.cuentas_digitales[0]
      : r.cuentas_digitales;
    const cierre = Array.isArray(r.cierres_diarios)
      ? r.cierres_diarios[0]
      : r.cierres_diarios;
    return {
      cierre_id: String(r.cierre_id),
      fecha: String(cierre?.fecha ?? ""),
      cuenta_id: String(cuenta?.id ?? ""),
      cuenta_nombre: String(cuenta?.nombre ?? "—"),
      propietario: cuenta?.propietario ?? null,
      monto: Number(r.monto ?? 0),
      descripcion: r.descripcion ?? null,
    };
  });

  movimientos.sort((a, b) => b.fecha.localeCompare(a.fecha));

  // Todas las cuentas aparecen en el resumen, incluso las que no movieron nada:
  // que una cuenta esté en cero también es información para el admin.
  const resumen: ResumenCuenta[] = (cuentas ?? []).map((c) => {
    const suyos = movimientos.filter((m) => m.cuenta_id === c.id);
    return {
      cuenta_id: c.id,
      cuenta_nombre: c.nombre,
      propietario: c.propietario,
      activo: c.activo,
      total: suyos.reduce((acc, m) => acc + m.monto, 0),
      movimientos: suyos.length,
    };
  });

  const totalPorDueno = { 1: 0, 2: 0, sinDueno: 0 };
  for (const m of movimientos) {
    if (m.propietario === 1 || m.propietario === 2) totalPorDueno[m.propietario] += m.monto;
    else totalPorDueno.sinDueno += m.monto;
  }

  return { movimientos, resumen, totalPorDueno };
}
