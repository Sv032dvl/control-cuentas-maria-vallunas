"use client";

import { useFormContext } from "react-hook-form";
import { Pizza } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { QtyStepper } from "../components/qty-stepper";
import { calcPizza, PORCIONES_POR_RUEDA, type CierreFormValues } from "../schema";

export function StepPizza() {
  const { watch, setValue } = useFormContext<CierreFormValues>();

  const ruedasInicio = watch("pizza_ruedas_inicio");
  const porcionesInicio = watch("pizza_porciones_inicio");
  const horneada = watch("pizza_horneada");
  const ruedasFinal = watch("pizza_ruedas_final");
  const porcionesFinal = watch("pizza_porciones_final");
  const notas = watch("pizza_notas");

  const pz = calcPizza({
    pizza_ruedas_inicio: ruedasInicio,
    pizza_porciones_inicio: porcionesInicio,
    pizza_horneada: horneada,
    pizza_ruedas_final: ruedasFinal,
    pizza_porciones_final: porcionesFinal,
  });

  function set(field: keyof CierreFormValues, value: number) {
    setValue(field, value, { shouldDirty: true });
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2.5 tracking-tight">
          <span className="flex items-center justify-center size-9 rounded-xl btn-gradient shadow-sm">
            <Pizza className="size-4 text-primary-foreground" />
          </span>
          Inventario de pizza
        </h2>
        <p className="text-sm text-muted-foreground">
          Registra las ruedas y porciones al abrir, producción del día, y al cerrar.
          <span className="text-muted-foreground/70"> (1 rueda = {PORCIONES_POR_RUEDA} porciones)</span>
        </p>
      </div>

      {/* Sección: Apertura */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Apertura
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <PizzaRow
            label="Ruedas"
            value={ruedasInicio}
            onChange={(n) => set("pizza_ruedas_inicio", n)}
            sub={ruedasInicio > 0 ? `= ${ruedasInicio * PORCIONES_POR_RUEDA} porc.` : undefined}
          />
          <PizzaRow
            label="Porciones sueltas"
            value={porcionesInicio}
            onChange={(n) => set("pizza_porciones_inicio", n)}
          />
        </div>
        {pz.inicio > 0 && (
          <p className="text-xs text-muted-foreground text-right tabular-nums">
            Total inicio: <strong>{pz.inicio}</strong> porciones
          </p>
        )}
      </div>

      {/* Sección: Producción */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Producción del día
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <PizzaRow
            label="Ruedas horneadas"
            value={horneada}
            onChange={(n) => set("pizza_horneada", n)}
            sub={horneada > 0 ? `= ${horneada * PORCIONES_POR_RUEDA} porc.` : undefined}
          />
        </div>
      </div>

      {/* Sección: Cierre */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Cierre
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <PizzaRow
            label="Ruedas"
            value={ruedasFinal}
            onChange={(n) => set("pizza_ruedas_final", n)}
            sub={ruedasFinal > 0 ? `= ${ruedasFinal * PORCIONES_POR_RUEDA} porc.` : undefined}
          />
          <PizzaRow
            label="Porciones sueltas"
            value={porcionesFinal}
            onChange={(n) => set("pizza_porciones_final", n)}
          />
        </div>
        {pz.restante > 0 && (
          <p className="text-xs text-muted-foreground text-right tabular-nums">
            Total restante: <strong>{pz.restante}</strong> porciones
          </p>
        )}
      </div>

      {/* Nota opcional */}
      <div className="space-y-2">
        <Label htmlFor="pizza-notas" className="text-sm text-muted-foreground">
          Notas (opcional)
        </Label>
        <Textarea
          id="pizza-notas"
          placeholder="Ej: Se botaron 3 porciones quemadas"
          maxLength={280}
          value={notas ?? ""}
          onChange={(e) => setValue("pizza_notas", e.target.value, { shouldDirty: true })}
          className="resize-none rounded-xl"
          rows={2}
        />
      </div>

      {/* Footer: Resumen */}
      {pz.disponible > 0 && (
        <div className="sticky bottom-20 md:bottom-4 z-10">
          <Card className="p-4 total-card-gradient border-0 rounded-2xl space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Disponible</span>
              <span className="tabular-nums">{pz.disponible} porc.</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Restante</span>
              <span className="tabular-nums">{pz.restante} porc.</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-1 border-t border-foreground/10">
              <span>Consumidas</span>
              <span className="tabular-nums">{pz.consumidas} porc.</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function PizzaRow({
  label,
  value,
  onChange,
  sub,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  sub?: string;
}) {
  const active = value > 0;
  return (
    <Card
      className={`p-3.5 flex items-center gap-3 transition-all duration-200 rounded-2xl ${
        active
          ? "ring-2 ring-primary/40 bg-primary/5 shadow-md shadow-primary/5 glass-panel border-primary/20"
          : "glass-panel"
      }`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {active && sub && (
          <p className="text-xs text-primary tabular-nums font-medium">{sub}</p>
        )}
      </div>
      <QtyStepper value={value} onChange={onChange} />
    </Card>
  );
}
