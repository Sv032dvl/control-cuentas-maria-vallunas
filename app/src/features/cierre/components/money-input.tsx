"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Input numérico con prefijo $, formato en miles en vivo, sin decimales.
 * Pensado para celular: teclado numérico, tamaño grande.
 */
type Props = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type" | "size"
> & {
  value: number | null | undefined;
  onValueChange: (n: number) => void;
  size?: "default" | "lg";
};

const fmt = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });

export function MoneyInput({
  value,
  onValueChange,
  size = "default",
  className,
  ...rest
}: Props) {
  const display = value == null || value === 0 ? "" : fmt.format(value);

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-2xl border bg-background/80 backdrop-blur-sm transition-all duration-200",
        "shadow-sm hover:shadow-md",
        "focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary/50 focus-within:shadow-md focus-within:shadow-primary/5",
        size === "lg" ? "h-14 px-4 text-2xl" : "h-11 px-3 text-base",
        className,
      )}
    >
      <span className="text-muted-foreground/70 font-medium">$</span>
      <input
        {...rest}
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        value={display}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d]/g, "");
          onValueChange(raw === "" ? 0 : Number(raw));
        }}
        className={cn(
          "min-w-0 flex-1 bg-transparent outline-none tabular-nums",
          size === "lg" ? "text-right" : "text-right",
        )}
      />
    </div>
  );
}
