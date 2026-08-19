"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navFor } from "./nav-items";

type Props = { role: "admin" | "empleado" };

export function BottomNav({ role }: Props) {
  const pathname = usePathname();
  // Los iconos se resuelven AQUÍ en el cliente, no en el Server Component ✅
  const items = navFor(role);

  return (
    <nav
      aria-label="Navegación principal"
      className="md:hidden sticky bottom-0 z-30 border-t bg-background/95 backdrop-blur pb-[env(safe-area-inset-bottom)]"
    >
      {/* Columnas según los ítems del rol: admin y empleado tienen distinta cantidad */}
      <ul
        className="mx-auto grid max-w-5xl gap-0.5 px-1 py-1.5"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href} className="contents">
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl px-0.5 py-1.5 text-[10px] font-medium leading-tight text-center transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "grid place-items-center size-9 rounded-xl transition-colors",
                    active && "bg-primary/12",
                  )}
                >
                  <Icon className="size-5" />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
