import type { Metadata } from "next";
import { requireRole } from "@/lib/supabase/session";
import { dateLong, todayISO } from "@/lib/format";
import { CierreWizard } from "@/features/cierre/cierre-wizard";
import {
  loadCatalogos,
  loadCierreHoy,
  loadVentasLoyverseHoy,
} from "@/features/cierre/loaders";

export const metadata: Metadata = {
  title: "Cierre del día",
};

export default async function CierrePage() {
  const { user } = await requireRole("empleado");

  // Los 3 loaders se ejecutan en PARALELO:
  // - catalogos: productos, unidades, categorías, denominaciones (de Supabase)
  // - existente: cierre borrador del día si existe (de Supabase)
  // - loyverseData: ventas y pagos digitales del día (de Loyverse API)
  const [catalogos, existente, loyverseData] = await Promise.all([
    loadCatalogos(),
    loadCierreHoy(user.id),
    loadVentasLoyverseHoy(),
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

      <CierreWizard
        catalogos={catalogos}
        existente={existente}
        loyverseData={loyverseData}
      />
    </div>
  );
}
