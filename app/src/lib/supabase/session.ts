/**
 * Helpers de sesión para Server Components.
 * Usar en páginas/layouts protegidos para obtener usuario + perfil tipados.
 */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/database.types";

export type Profile = Tables<"profiles">;

/**
 * Obtiene el usuario autenticado + su profile, o redirige a /login.
 * Para usar en RSC de páginas protegidas.
 */
export async function requireSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    // Sesión válida pero sin profile → fuerza logout para limpiar.
    await supabase.auth.signOut();
    redirect("/login");
  }

  return { supabase, user, profile };
}

/**
 * Variante que además exige un rol específico.
 */
export async function requireRole(role: "admin" | "empleado") {
  const session = await requireSession();
  if (session.profile.role !== role) {
    // Manda al "home" correcto según su rol real.
    redirect(session.profile.role === "admin" ? "/dashboard" : "/cierre");
  }
  return session;
}
