"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navFor } from "./nav-items";

type Props = { role: "admin" | "empleado" };

export function SideNav({ role }: Props) {
  const pathname = usePathname();
  // Los iconos se resuelven AQUÍ en el cliente, no en el Server Component ✅
  const items = navFor(role);

  return (
    <aside
      aria-label="Navegación lateral"
      className="hidden md:block w-60 shrink-0 border-r bg-sidebar text-sidebar-foreground"
    >
      <nav className="sticky top-14 p-3">
        <ul className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
