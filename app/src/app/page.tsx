import { redirect } from "next/navigation";

export default function HomePage() {
  // El middleware se encargará de redirigir a /login si no hay sesión,
  // o de enviar al destino según el rol (empleado → /cierre, admin → /dashboard).
  redirect("/login");
}
