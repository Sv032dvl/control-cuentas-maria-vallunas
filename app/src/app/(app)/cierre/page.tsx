import type { Metadata } from "next";
import { requireRole } from "@/lib/supabase/session";
import { dateLong, todayISO } from "@/lib/format";
import { CierreWizard } from "@/features/cierre/cierre-wizard";
import { loadCatalogos, loadCierreHoy } from "@/features/cierre/loaders";

export const metadata: Metadata = {
  title: "Cierre del día",
};

export default async function CierrePage() {
  const { user } = await requireRole("empleado");

  const [catalogos, existente] = await Promise.all([
    loadCatalogos(),
    loadCierreHoy(user.id),
  ]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          Cierre del día
        </p>
        <h1 className="text-2xl font-semibold capitalize">
          {dateLong(todayISO())}
        </h1>
      </header>

      <CierreWizard catalogos={catalogos} existente={existente} />
    </div>
  );
}
