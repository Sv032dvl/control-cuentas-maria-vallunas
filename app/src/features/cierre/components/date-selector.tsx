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
    <header className="space-y-2">
      <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-semibold">
        Cierre del día
      </p>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="size-9 rounded-xl shadow-sm"
          onClick={() => navigate(addDays(fecha, -1))}
          disabled={!canGoBack}
          aria-label="Día anterior"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold capitalize tracking-tight">
          {dateLong(fecha)}
        </h1>
        <Button
          variant="outline"
          size="icon"
          className="size-9 rounded-xl shadow-sm"
          onClick={() => navigate(addDays(fecha, 1))}
          disabled={!canGoForward}
          aria-label="Día siguiente"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
      {!isHoy && (
        <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-100/80 dark:bg-amber-950/30 px-2.5 py-1 text-xs text-amber-700 dark:text-amber-400 font-medium">
          <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
          Estás editando un cierre de hace {daysBack} día{daysBack > 1 ? "s" : ""}
        </div>
      )}
    </header>
  );
}
