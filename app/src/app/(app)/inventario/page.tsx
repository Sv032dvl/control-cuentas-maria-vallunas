import type { Metadata } from "next";
import { requireRole } from "@/lib/supabase/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Inventario pizza",
};

export default async function InventarioPage() {
  await requireRole("empleado");

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          Inventario
        </p>
        <h1 className="text-2xl font-semibold">Control de masa de pizza</h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Próximamente</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Módulo de mermas — ruedas, porciones, horneada del día.
        </CardContent>
      </Card>
    </div>
  );
}
