"use client";

import { useFormContext } from "react-hook-form";
import { Banknote } from "lucide-react";
import { Card } from "@/components/ui/card";
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
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Banknote className="size-5 text-primary" /> Arqueo de billetes
        </h2>
        <p className="text-sm text-muted-foreground">
          Cuenta los billetes y monedas que quedaron en caja.
        </p>
      </div>

      <ul className="space-y-2">
        {denominaciones.map((d) => {
          const qty = getCantidad(d.id);
          const sub = qty * d.valor;
          return (
            <li key={d.id}>
              <Card className="p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-semibold tabular-nums">
                    {money(d.valor)}
                  </p>
                  {qty > 0 && (
                    <p className="text-xs text-primary tabular-nums">
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

      <Card className="p-3 flex items-center justify-between bg-primary text-primary-foreground">
        <span className="font-medium">Total contado</span>
        <span className="text-xl font-bold tabular-nums">{money(total)}</span>
      </Card>
    </div>
  );
}
