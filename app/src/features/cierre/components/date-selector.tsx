"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dateLong, todayISO } from "@/lib/format";

type Props = {
  fecha: string; // YYYY-MM-DD
};

/** Máximo 2 días atrás desde hoy. */
const MAX_DAYS_BACK = 2;

function addDays(dateStr: string, days: number) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function diffDays(a: string, b: string) {
  const da = new Date(`${a}T00:00:00`);
  const db = new Date(`${b}T00:00:00`);
  return Math.round((da.getTime() - db.getTime()) / 86400000);
}

export function DateSelector({ fecha }: Props) {
  const router = useRouter();
  const hoy = todayISO();
  const isHoy = fecha === hoy;
  const daysBack = diffDays(hoy, fecha);
  const canGoBack = daysBack < MAX_DAYS_BACK;
  const canGoForward = !isHoy;

  function navigate(newFecha: string) {
    if (newFecha === hoy) {
      router.push("/cierre");
    } else {
      router.push(`/cierre?fecha=${newFecha}`);
    }
  }

  return (
    <header className="space-y-1">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">
        Cierre del día
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => navigate(addDays(fecha, -1))}
          disabled={!canGoBack}
          aria-label="Día anterior"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <h1 className="text-2xl font-semibold capitalize">
          {dateLong(fecha)}
        </h1>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => navigate(addDays(fecha, 1))}
          disabled={!canGoForward}
          aria-label="Día siguiente"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
      {!isHoy && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Estás editando un cierre de hace {daysBack} día{daysBack > 1 ? "s" : ""}
        </p>
      )}
    </header>
  );
}
