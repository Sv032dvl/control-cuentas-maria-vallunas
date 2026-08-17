"use client";

import { useFormContext } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PROPIETARIOS } from "@/lib/negocio";
import { calcLiquidacion, type CierreFormValues } from "../schema";
import type { CatalogProducto, CatalogUnidad } from "../loaders";

/**
 * El negocio es una sola caja con dos dueños. Estas tarjetas muestran cuánto
 * le corresponde a cada uno en el día: sus ventas menos sus gastos.
 *
 * Cada tarjeta se oculta si ese dueño no tuvo movimiento, para no ensuciar
 * el resumen en días donde solo operó uno.
 */
export function LiquidacionesCard({
  productos,
  unidades,
}: {
  productos: CatalogProducto[];
  unidades: CatalogUnidad[];
}) {
  const { watch } = useFormContext<CierreFormValues>();
  const valores = watch();

  const liquidaciones = PROPIETARIOS.map((p) => ({
    ...p,
    calc: calcLiquidacion(valores, productos, unidades, p.id),
  })).filter(
    ({ calc }) => calc.ingresos !== 0 || calc.gastos !== 0 || calc.totalPizzas > 0,
  );

  if (liquidaciones.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground px-1">
        Le corresponde a cada dueño
      </h3>
      {liquidaciones.map(({ id, nombre, emoji, calc }) => (
        <Card
          key={id}
          className="p-5 space-y-3 rounded-2xl border border-border/60 bg-card/60 shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center size-8 rounded-xl bg-muted text-base">
              {emoji}
            </span>
            <h4 className="font-bold tracking-tight">{nombre}</h4>
          </div>

          <div className="space-y-2 text-sm">
            <Fila label="Ingresos" value={money(calc.ingresos)} />
            <Fila label="− Gastos" value={money(calc.gastos)} />
            <hr className="border-border/60" />
            <div className="flex justify-between items-baseline pt-0.5">
              <span className="font-semibold">Le corresponde</span>
              <span
                className={cn(
                  "text-2xl font-extrabold tabular-nums tracking-tight",
                  calc.liquidacion < 0 ? "text-destructive" : "text-primary",
                )}
              >
                {money(calc.liquidacion)}
              </span>
            </div>
          </div>

          {calc.totalPizzas > 0 && (
            <div className="flex items-baseline justify-between rounded-xl bg-muted/60 px-3.5 py-2.5">
              <div>
                <p className="text-xs text-muted-foreground">Pizzas vendidas</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {calc.tradicionales} tradicionales · {calc.especiales} especiales
                </p>
              </div>
              <span className="text-2xl font-extrabold tabular-nums text-primary">
                {calc.totalPizzas}
              </span>
            </div>
          )}
        </Card>
      ))}
    </div>
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
