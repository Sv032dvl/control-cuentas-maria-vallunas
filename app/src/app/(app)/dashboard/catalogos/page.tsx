import type { Metadata } from "next";
import { requireRole } from "@/lib/supabase/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Catálogos" };

export default async function CatalogosPage() {
  await requireRole("admin");
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          Configuración
        </p>
        <h1 className="text-2xl font-semibold">Catálogos</h1>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Próximamente</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Editor de productos, categorías de egreso, denominaciones y reglas de prorrateo.
        </CardContent>
      </Card>
    </div>
  );
}
