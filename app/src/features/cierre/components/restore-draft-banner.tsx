"use client";

import { RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { LocalDraft } from "../hooks/use-auto-save";

type Props = {
  draft: LocalDraft;
  stepLabels: string[];
  onRestore: () => void;
  onDiscard: () => void;
};

export function RestoreDraftBanner({ draft, stepLabels, onRestore, onDiscard }: Props) {
  const time = new Date(draft.timestamp).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const stepLabel = stepLabels[draft.step] ?? `Paso ${draft.step + 1}`;

  return (
    <Alert className="border-blue-200/70 bg-blue-50/80 dark:bg-blue-950/30 dark:border-blue-800/40 rounded-2xl shadow-sm backdrop-blur-sm">
      <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm">
          Borrador local encontrado ({stepLabel}, {time})
        </span>
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="outline" onClick={onDiscard} className="h-8 text-xs rounded-xl">
            <X className="size-3" /> Descartar
          </Button>
          <Button type="button" size="sm" onClick={onRestore} className="h-8 text-xs rounded-xl btn-gradient border-0 font-semibold">
            <RotateCcw className="size-3" /> Restaurar
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
