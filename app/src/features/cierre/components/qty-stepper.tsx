"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  className?: string;
};

/**
 * Selector de cantidad con botones +/− grandes para celular.
 * El input central también es editable directamente.
 */
export function QtyStepper({
  value,
  onChange,
  min = 0,
  max = 9999,
  className,
}: Props) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-xl border bg-background",
        className,
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-11 rounded-l-xl rounded-r-none"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= min}
        aria-label="Restar"
      >
        <Minus className="size-4" />
      </Button>
      <input
        inputMode="numeric"
        pattern="[0-9]*"
        value={value === 0 ? "" : value}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d]/g, "");
          onChange(clamp(raw === "" ? 0 : Number(raw)));
        }}
        placeholder="0"
        className="w-14 h-11 text-center bg-transparent outline-none text-lg font-semibold tabular-nums"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-11 rounded-r-xl rounded-l-none"
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= max}
        aria-label="Sumar"
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}
