import type { Metadata } from "next";
import { requireRole } from "@/lib/supabase/session";
import { loadAuditoriaDigital } from "@/features/cuentas-digitales/loaders";
import { AuditoriaTable } from "@/features/cuentas-digitales/auditoria-table";

export const metadata: Metadata = { title: "Cuentas digitales" };

export default async function CuentasDigitalesPage() {
  await requireRole("admin");
  const datos = await loadAuditoriaDigital(30);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          Auditoría
        </p>
        <h1 className="text-2xl font-semibold">Cuentas digitales</h1>
        <p className="text-sm text-muted-foreground">
          Últimos 30 días. La cuenta que recibe el pago define a qué dueño se le
          abona.
        </p>
      </header>

      <AuditoriaTable datos={datos} />
    </div>
  );
}
