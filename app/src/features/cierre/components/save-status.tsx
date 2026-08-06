"use client";

import { Cloud, CloudOff, Loader2 } from "lucide-react";
import type { SaveStatus } from "../hooks/use-auto-save";

type Props = {
  status: SaveStatus;
  lastSavedAt: Date | null;
};

export function SaveStatusIndicator({ status, lastSavedAt }: Props) {
  if (status === "idle") return null;

  const time = lastSavedAt
    ? lastSavedAt.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-muted/50 backdrop-blur-sm">
      {status === "saving" && (
        <>
          <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Guardando…</span>
        </>
      )}
      {status === "saved" && (
        <>
          <Cloud className="size-3.5 text-green-600 dark:text-green-400" />
          <span className="text-green-600 dark:text-green-400">
            Guardado {time}
          </span>
        </>
      )}
      {status === "error" && (
        <>
          <CloudOff className="size-3.5 text-red-600 dark:text-red-400" />
          <span className="text-red-600 dark:text-red-400">Error al guardar</span>
        </>
      )}
    </div>
  );
}
