import type { Metadata } from "next";
import { requireRole } from "@/lib/supabase/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Usuarios" };

export default async function UsuariosPage() {
  await requireRole("admin");
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, nombre, role, activo")
    .order("nombre");

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          Personas
        </p>
        <h1 className="text-2xl font-semibold">Usuarios</h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Equipo</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {(profiles ?? []).map((p) => (
              <li key={p.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{p.nombre}</p>
                  <p className="text-xs text-muted-foreground">{p.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={p.role === "admin" ? "default" : "secondary"} className="capitalize">
                    {p.role}
                  </Badge>
                  {!p.activo && <Badge variant="outline">Inactivo</Badge>}
                </div>
              </li>
            ))}
            {profiles?.length === 0 && (
              <li className="py-6 text-center text-sm text-muted-foreground italic">
                Aún no hay usuarios.
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
