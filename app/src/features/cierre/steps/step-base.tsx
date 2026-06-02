"use client";

import { useFormContext } from "react-hook-form";
import { Wallet } from "lucide-react";
import { MoneyInput } from "../components/money-input";
import { Label } from "@/components/ui/label";
import type { CierreFormValues } from "../schema";

export function StepBase() {
  const { watch, setValue } = useFormContext<CierreFormValues>();
  const value = watch("base_inicial");

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Wallet className="size-5 text-primary" /> Base inicial de caja
        </h2>
        <p className="text-sm text-muted-foreground">
          Efectivo con el que abriste la caja esta mañana.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="base">Monto</Label>
        <MoneyInput
          id="base"
          size="lg"
          value={value ?? 0}
          onValueChange={(n) =>
            setValue("base_inicial", n, { shouldDirty: true, shouldValidate: true })
          }
          autoFocus
        />
        <p className="text-xs text-muted-foreground">
          Si no recibiste base, déjalo en $0.
        </p>
      </div>
    </div>
  );
}
