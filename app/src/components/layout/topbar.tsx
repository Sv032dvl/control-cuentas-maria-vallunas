"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { LogOut, Moon, Sun, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type Props = {
  nombre: string;
  role: "admin" | "empleado";
};

function initials(nombre: string) {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
}

export function Topbar({ nombre, role }: Props) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const dark = mounted && theme === "dark";

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
        <div className="flex items-center gap-2">
          {/* Logo real en lugar del badge "MV" */}
          <div className="size-9 rounded-lg bg-[#fff3d4] grid place-items-center overflow-hidden border border-[#D8A22F]/20">
            <Image
              src="/logo.svg"
              alt="María Vallunas"
              width={30}
              height={33}
              className="object-contain"
            />
          </div>
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="text-sm font-semibold text-[#5E3B3C] dark:text-foreground">
              María Vallunas
            </span>
            <span className="text-[11px] text-muted-foreground uppercase tracking-wide">
              Control de caja
            </span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Cambiar tema"
            onClick={() => setTheme(dark ? "light" : "dark")}
            className="size-9"
          >
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex h-9 items-center gap-2 rounded-md px-2 text-sm hover:bg-accent hover:text-accent-foreground"
              aria-label="Menú de usuario"
            >
              <Avatar className="size-7">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {initials(nombre) || <User className="size-4" />}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline">{nombre}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{nombre}</span>
                    <span className="text-[11px] text-muted-foreground capitalize">
                      {role}
                    </span>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="size-4" /> Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
