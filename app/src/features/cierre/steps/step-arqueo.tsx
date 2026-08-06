"use client";

import { useFormContext } from "react-hook-form";
import { Banknote } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { QtyStepper } from "../components/qty-stepper";
import { money } from "@/lib/format";
import type { CatalogDenominacion } from "../loaders";
import type { CierreFormValues } from "../schema";

type Props = { denominaciones: CatalogDenominacion[] };

export function StepArqueo({ denominaciones }: Props) {
  const { watch, setValue } = useFormContext<CierreFormValues>();
  const arqueo = watch("arqueo");

  function getCantidad(denomId: string) {
    return arqueo.find((a) => a.denominacion_id === denomId)?.cantidad ?? 0;
  }

  function setCantidad(denomId: string, cantidad: number, valor: number) {
    const next = arqueo.filter((a) => a.denominacion_id !== denomId);
    if (cantidad > 0) next.push({ denominacion_id: denomId, valor, cantidad });
    setValue("arqueo", next, { shouldDirty: true, shouldValidate: true });
  }

  const total = arqueo.reduce((acc, a) => acc + a.valor * a.cantidad, 0);

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2.5 tracking-tight">
          <span className="flex items-center justify-center size-9 rounded-xl btn-gradient shadow-sm">
            <Banknote className="size-4 text-primary-foreground" />
          </span>
          Arqueo de billetes
        </h2>
        <p className="text-sm text-muted-foreground">
          Cuenta los billetes y monedas que quedaron en caja.
        </p>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {denominaciones.map((d) => {
          const qty = getCantidad(d.id);
          const sub = qty * d.valor;
          const active = qty > 0;
          return (
            <li key={d.id}>
              <Card
                className={cn(
                  "p-3.5 flex items-center gap-3 transition-all duration-200 rounded-2xl",
                  active
                    ? "ring-2 ring-primary/40 bg-primary/5 shadow-md shadow-primary/5 glass-panel border-primary/20"
                    : "glass-panel",
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-semibold tabular-nums">
                    {money(d.valor)}
                  </p>
                  {active && (
                    <p className="text-xs text-primary tabular-nums font-medium">
                      = {money(sub)}
                    </p>
                  )}
                </div>
                <QtyStepper
                  value={qty}
                  onChange={(n) => setCantidad(d.id, n, d.valor)}
                />
              </Card>
            </li>
          );
        })}
      </ul>

      <div className="sticky bottom-20 md:bottom-4 z-10">
        <Card className="p-4 flex items-center justify-between total-card-gradient border-0 rounded-2xl">
          <span className="font-medium">Total contado</span>
          <span className="text-xl font-bold tabular-nums">{money(total)}</span>
        </Card>
      </div>
    </div>
  );
}
