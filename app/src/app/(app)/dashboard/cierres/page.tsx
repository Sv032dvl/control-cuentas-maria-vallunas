import type { Metadata } from "next";
import { requireRole } from "@/lib/supabase/session";
import { CierresTable } from "@/features/dashboard/cierres-table";
import { loadCuadreUltimos } from "@/features/dashboard/loaders";

export const metadata: Metadata = {
  title: "Cierres",
};

export default async function CierresIndexPage() {
  await requireRole("admin");
  const rows = await loadCuadreUltimos(90);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          Histórico
        </p>
        <h1 className="text-2xl font-semibold">Cierres últimos 90 días</h1>
      </header>

      <CierresTable rows={rows} />
    </div>
  );
}
