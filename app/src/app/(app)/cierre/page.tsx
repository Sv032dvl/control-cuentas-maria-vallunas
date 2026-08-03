import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/supabase/session";
import { todayISO } from "@/lib/format";
import { CierreWizard } from "@/features/cierre/cierre-wizard";
import { DateSelector } from "@/features/cierre/components/date-selector";
import {
  loadCatalogos,
  loadCierreByFecha,
  loadVentasLoyverse,
} from "@/features/cierre/loaders";

export const metadata: Metadata = {
  title: "Cierre del día",
};

/** Máximo 2 días atrás permitidos. */
const MAX_DAYS_BACK = 2;

function isValidFecha(fecha: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const d = new Date(`${fecha}T00:00:00`);
  return !isNaN(d.getTime());
}

function isWithinRange(fecha: string): boolean {
  const hoy = new Date(`${todayISO()}T00:00:00`);
  const target = new Date(`${fecha}T00:00:00`);
  const diff = Math.round((hoy.getTime() - target.getTime()) / 86400000);
  return diff >= 0 && diff <= MAX_DAYS_BACK;
}

type Props = {
  searchParams: Promise<{ fecha?: string }>;
};

export default async function CierrePage({ searchParams }: Props) {
  const { user } = await requireRole("empleado");
  const params = await searchParams;
  const fecha = params.fecha ?? todayISO();

  // Validar fecha y rango
  if (params.fecha && (!isValidFecha(fecha) || !isWithinRange(fecha))) {
    redirect("/cierre");
  }

  const [catalogos, existente, loyverseData] = await Promise.all([
    loadCatalogos(),
    loadCierreByFecha(user.id, fecha),
    loadVentasLoyverse(fecha),
  ]);

  return (
    <div className="space-y-6">
      <DateSelector fecha={fecha} />

      <CierreWizard
        catalogos={catalogos}
        existente={existente}
        loyverseData={loyverseData}
        fecha={fecha}
      />
    </div>
  );
}
