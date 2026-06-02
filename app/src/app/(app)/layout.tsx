import { requireSession } from "@/lib/supabase/session";
import { Topbar } from "@/components/layout/topbar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SideNav } from "@/components/layout/side-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireSession();
  // Solo pasamos strings al cliente — los iconos los resuelve cada Client Component
  const role = (profile.role as "admin" | "empleado") ?? "empleado";

  return (
    <>
      <Topbar nombre={profile.nombre} role={role} />
      <div className="flex flex-1 w-full mx-auto max-w-5xl">
        <SideNav role={role} />
        <main className="flex-1 min-w-0 px-4 py-6 md:px-8 md:py-8 pb-24 md:pb-12">
          {children}
        </main>
      </div>
      <BottomNav role={role} />
    </>
  );
}
