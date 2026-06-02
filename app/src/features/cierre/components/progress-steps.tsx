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
        <span className="font-medium text-foreground">
          Paso {current + 1} de {steps.length}:{" "}
          <span className="text-primary">{steps[current]?.label}</span>
        </span>
        <span className="text-muted-foreground tabular-nums">
          {Math.round(pct)}%
        </span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
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
                  "flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors",
                  active && "bg-primary/10 text-primary font-medium",
                  done && "text-foreground",
                  !active && !done && "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "grid place-items-center size-5 rounded-full text-[10px] font-bold",
                    active && "bg-primary text-primary-foreground",
                    done && "bg-success text-success-foreground",
                    !active && !done && "bg-muted text-muted-foreground",
                  )}
                >
                  {done ? <Check className="size-3" /> : idx + 1}
                </span>
                {s.short}
              </button>
              {idx < steps.length - 1 && (
                <span className="h-px w-3 bg-border" aria-hidden />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
