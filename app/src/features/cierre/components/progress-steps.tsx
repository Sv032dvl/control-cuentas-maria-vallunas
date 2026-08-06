"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type Step = { id: string; label: string; short: string };

type Props = {
  steps: Step[];
  current: number;
  onJump?: (idx: number) => void;
};

export function ProgressSteps({ steps, current, onJump }: Props) {
  const pct = ((current + 1) / steps.length) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-foreground">
          Paso {current + 1}{" "}
          <span className="text-muted-foreground font-normal">de {steps.length}</span>
          <span className="mx-1.5 text-muted-foreground/50">|</span>
          <span className="text-primary">{steps[current]?.label}</span>
        </span>
        <span className="text-muted-foreground tabular-nums font-medium">
          {Math.round(pct)}%
        </span>
      </div>

      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted/60 glass-panel">
        <div
          className="h-full rounded-full btn-gradient transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ol className="hidden md:flex items-center gap-2 text-xs">
        {steps.map((s, idx) => {
          const done = idx < current;
          const active = idx === current;
          return (
            <li key={s.id} className="contents">
              <button
                type="button"
                onClick={() => onJump?.(idx)}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 transition-all duration-200",
                  active && "glass-panel bg-primary/8 text-primary font-semibold shadow-sm",
                  done && "text-foreground hover:bg-muted/50",
                  !active && !done && "text-muted-foreground hover:text-foreground hover:bg-muted/40",
                )}
              >
                <span
                  className={cn(
                    "grid place-items-center size-6 rounded-full text-[10px] font-bold transition-all",
                    active && "btn-gradient text-primary-foreground shadow-sm",
                    done && "total-card-success text-success-foreground",
                    !active && !done && "bg-muted text-muted-foreground",
                  )}
                >
                  {done ? <Check className="size-3" /> : idx + 1}
                </span>
                {s.short}
              </button>
              {idx < steps.length - 1 && (
                <span className="h-px w-4 bg-border/60" aria-hidden />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
