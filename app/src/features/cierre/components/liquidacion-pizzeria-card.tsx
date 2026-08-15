"use client";

import { useFormContext } from "react-hook-form";
import { Pizza } from "lucide-react";
import { Card } from "@/components/ui/card";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";
import { calcPizzeria, type CierreFormValues } from "../schema";
import type { CatalogProducto } from "../loaders";

/**
 * El negocio es una sola caja con dos propietarios. Esta tarjeta muestra
 * cuánto le corresponde al dueño de Pizzería en el día y cuántas pizzas
 * se vendieron, separando tradicionales de especiales.
 *
 * Se oculta en días sin movimiento de pizzería para no ensuciar el resumen.
 */
export function LiquidacionPizzeriaCard({ productos }: { productos: CatalogProducto[] }) {
  const { watch } = useFormContext<CierreFormValues>();
  const liq = calcPizzeria(watch(), productos);

  const sinMovimiento = liq.ingresos === 0 && liq.gastos === 0 && liq.totalPizzas === 0;
  if (sinMovimiento) return null;

  return (
    <Card className="p-5 space-y-3 rounded-2xl border border-orange-200/70 bg-orange-50/60 dark:border-orange-800/40 dark:bg-orange-950/20 shadow-sm">
      <div className="flex items-center gap-2.5">
        <span className="flex items-center justify-center size-8 rounded-xl bg-orange-500/15">
          <Pizza className="size-4 text-orange-600 dark:text-orange-400" />
        </span>
        <h3 className="font-bold tracking-tight">Pizzería</h3>
      </div>

      <div className="space-y-2 text-sm">
        <Fila label="Ingresos" value={money(liq.ingresos)} />
        <Fila label="− Gastos" value={money(liq.gastos)} />
        <hr className="border-orange-200/70 dark:border-orange-800/40" />
        <div className="flex justify-between items-baseline pt-0.5">
          <span className="font-semibold">Le corresponde</span>
          <span
            className={cn(
              "text-2xl font-extrabold tabular-nums tracking-tight",
              liq.liquidacion < 0
                ? "text-destructive"
                : "text-orange-700 dark:text-orange-300",
            )}
          >
            {money(liq.liquidacion)}
          </span>
        </div>
      </div>

      <div className="flex items-baseline justify-between rounded-xl bg-orange-500/10 px-3.5 py-2.5">
        <div>
          <p className="text-xs text-muted-foreground">Pizzas vendidas</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {liq.tradicionales} tradicionales · {liq.especiales} especiales
          </p>
        </div>
        <span className="text-2xl font-extrabold tabular-nums text-orange-700 dark:text-orange-300">
          {liq.totalPizzas}
        </span>
      </div>
    </Card>
  );
}

function Fila({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums font-medium">{value}</span>
    </div>
  );
}
