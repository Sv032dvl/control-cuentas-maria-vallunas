import type { Metadata } from "next";
import { requireRole } from "@/lib/supabase/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CrearUsuarioForm } from "@/features/usuarios/crear-usuario-form";
import { UsuarioAcciones } from "@/features/usuarios/usuario-acciones";

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
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            Personas
          </p>
          <h1 className="text-2xl font-semibold">Usuarios</h1>
        </div>
        <CrearUsuarioForm />
      </div>

      {/* Lista de usuarios */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Equipo ({profiles?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y">
            {(profiles ?? []).map((p) => (
              <li
                key={p.id}
                className="px-6 py-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{p.nombre}</p>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {p.id}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant={p.role === "admin" ? "default" : "secondary"}
                    className="capitalize"
                  >
                    {p.role}
                  </Badge>
                  {!p.activo && (
                    <Badge variant="outline" className="text-muted-foreground">
                      Inactivo
                    </Badge>
                  )}
                  <UsuarioAcciones
                    userId={p.id}
                    activo={p.activo}
                    nombre={p.nombre}
                    role={p.role as "empleado" | "admin"}
                  />
                </div>
              </li>
            ))}

            {(profiles?.length ?? 0) === 0 && (
              <li className="px-6 py-10 text-center text-sm text-muted-foreground italic">
                Aún no hay usuarios. Crea el primero con el botón de arriba.
              </li>
            )}
          </ul>
        </CardContent>
      </Card>

      {/* Credenciales de prueba (solo visible en dev) */}
      {process.env.NODE_ENV === "development" && (
        <div className="rounded-lg border border-dashed p-4 text-sm space-y-1 text-muted-foreground">
          <p className="font-medium text-foreground">Credenciales de prueba</p>
          <p>
            Admin: <code>diegor64@gmail.com</code> /{" "}
            <code>admin123</code>
          </p>
          <p>
            Empleado: <code>empleado@mariavallunas.com</code> /{" "}
            <code>empl123</code>
          </p>
        </div>
      )}
    </div>
  );
}
