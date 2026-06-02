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
        "flex items-center gap-1 rounded-lg border bg-background transition-colors",
        "focus-within:ring-2 focus-within:ring-ring focus-within:border-ring",
        size === "lg" ? "h-14 px-3 text-2xl" : "h-10 px-3 text-base",
        className,
      )}
    >
      <span className="text-muted-foreground">$</span>
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
