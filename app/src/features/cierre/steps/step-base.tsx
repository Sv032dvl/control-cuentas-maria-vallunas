"use client";

import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Wallet, Banknote, Coins, Check, Pencil } from "lucide-react";
import { MoneyInput } from "../components/money-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { money } from "@/lib/format";
import type { CierreFormValues } from "../schema";

export function StepBase() {
  const { watch, setValue } = useFormContext<CierreFormValues>();
  const billetes = watch("base_billetes");
  const monedas = watch("base_monedas");
  const confirmado = watch("base_confirmado");
  const total = (billetes ?? 0) + (monedas ?? 0);

  // Sincronizar base_inicial = billetes + monedas
  useEffect(() => {
    setValue("base_inicial", total, { shouldDirty: true });
  }, [total, setValue]);

  function handleConfirm() {
    setValue("base_confirmado", true, { shouldDirty: true });
  }

  function handleEdit() {
    setValue("base_editado", true, { shouldDirty: true });
    setValue("base_confirmado", false, { shouldDirty: true });
  }

  function handleValueChange(
    field: "base_billetes" | "base_monedas",
    n: number,
  ) {
    // Si ya estaba confirmado con un monto real, marcar como editado
    if (confirmado && total > 0) {
      setValue("base_editado", true, { shouldDirty: true });
      setValue("base_confirmado", false, { shouldDirty: true });
    }
    setValue(field, n, { shouldDirty: true, shouldValidate: true });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2.5 tracking-tight">
          <span className="flex items-center justify-center size-9 rounded-xl btn-gradient shadow-sm">
            <Wallet className="size-4 text-primary-foreground" />
          </span>
          Base inicial de caja
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Efectivo con el que abriste la caja esta mañana.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="billetes" className="flex items-center gap-1.5">
            <Banknote className="size-4 text-muted-foreground" /> Billetes
          </Label>
          <MoneyInput
            id="billetes"
            size="lg"
            value={billetes ?? 0}
            onValueChange={(n) => handleValueChange("base_billetes", n)}
            disabled={confirmado && total > 0}
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="monedas" className="flex items-center gap-1.5">
            <Coins className="size-4 text-muted-foreground" /> Monedas
          </Label>
          <MoneyInput
            id="monedas"
            size="lg"
            value={monedas ?? 0}
            onValueChange={(n) => handleValueChange("base_monedas", n)}
            disabled={confirmado && total > 0}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Si no recibiste base, deja ambos en $0.
      </p>

      {/* Alerta de confirmación */}
      {total > 0 && (
        <Alert
          className={cn(
            "border transition-all duration-300 rounded-2xl shadow-sm",
            confirmado
              ? "border-green-300 bg-green-50/80 dark:bg-green-950/30 dark:border-green-800/50 shadow-green-100/50 dark:shadow-green-900/10"
              : "border-amber-300 bg-amber-50/80 dark:bg-amber-950/30 dark:border-amber-800/50 shadow-amber-100/50 dark:shadow-amber-900/10",
          )}
        >
          <AlertTitle className="text-base font-semibold tabular-nums">
            Total base: {money(total)}
          </AlertTitle>
          <AlertDescription>
            Billetes: {money(billetes ?? 0)} + Monedas: {money(monedas ?? 0)}
          </AlertDescription>
          <div className="mt-3">
            {confirmado ? (
              <div className="flex items-center gap-2">
                <Badge className="bg-green-600 text-white">
                  <Check className="size-3" /> Confirmado
                </Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleEdit}
                  className="h-7 text-xs"
                >
                  <Pencil className="size-3" /> Editar
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={handleConfirm}
                className="h-9 rounded-xl btn-gradient border-0 font-semibold px-4"
              >
                <Check className="size-4" /> Confirmar total
              </Button>
            )}
          </div>
        </Alert>
      )}
    </div>
  );
}
