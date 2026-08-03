import type { Metadata } from "next";
import { requireRole } from "@/lib/supabase/session";
import { loadFacturas } from "@/features/facturas/loaders";
import { FacturasTable } from "@/features/facturas/facturas-table";

export const metadata: Metadata = {
  title: "Facturas proveedores",
};

export default async function FacturasPage() {
  await requireRole("admin");
  const facturas = await loadFacturas();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Facturas proveedores</h1>
        <p className="text-sm text-muted-foreground">
          Control de facturas de compras a proveedores.
        </p>
      </header>

      <FacturasTable facturas={facturas} />
    </div>
  );
}
