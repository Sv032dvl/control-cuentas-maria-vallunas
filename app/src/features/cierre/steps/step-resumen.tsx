"use client";

import { useFormContext } from "react-hook-form";
import { Calculator, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { money, moneyDecimal } from "@/lib/format";
import { calcTotales } from "../schema";
import { cn } from "@/lib/utils";
import type { CierreFormValues } from "../schema";

export function StepResumen() {
  const { watch, setValue } = useFormContext<CierreFormValues>();
  const all = watch();
  const t = calcTotales(all);

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Calculator className="size-5 text-primary" /> Cuadre del día
        </h2>
        <p className="text-sm text-muted-foreground">
          Verifica los totales y deja una nota si la diferencia no es cero.
        </p>
      </div>

      <Card
        className={cn(
          "p-4 space-y-1 border-2",
          t.cuadrado
            ? "border-success bg-success/5"
            : "border-destructive bg-destructive/5",
        )}
      >
        <div className="flex items-center gap-2">
          {t.cuadrado ? (
            <CheckCircle2 className="size-5 text-success" />
          ) : (
            <AlertTriangle className="size-5 text-destructive" />
          )}
          <Badge variant={t.cuadrado ? "default" : "destructive"}>
            {t.cuadrado ? "Cuadrado" : "Descuadrado"}
          </Badge>
        </div>
        <p className="text-3xl font-bold tabular-nums mt-1">
          {moneyDecimal(t.diferencia)}
        </p>
        <p className="text-xs text-muted-foreground">
          {t.diferencia > 0
            ? "Sobra en caja"
            : t.diferencia < 0
              ? "Falta en caja"
              : "Caja perfecta"}
        </p>
      </Card>

      <Card className="p-4 space-y-2 text-sm">
        <Row label="Base inicial" value={t.base} />
        <Row label="+ Ventas TPV" value={t.ventasTpv} positive />
        <Row label="− Ingresos digitales" value={t.digital} />
        <Row label="− Egresos en efectivo" value={t.egresosEfectivo} />
        <hr className="border-border my-1" />
        <Row label="= Efectivo esperado" value={t.efectivoEsperado} bold />
        <Row label="Arqueo (lo que contaste)" value={t.arqueo} bold />
      </Card>

      {!t.cuadrado && Math.abs(t.diferencia) > 10000 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 px-3 py-2">
          <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Diferencia inusual ({money(Math.abs(t.diferencia))}). Revisa ventas y arqueo antes de cerrar.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="nota">
          Nota sobre la diferencia {!t.cuadrado && <span className="text-destructive">*</span>}
        </Label>
        <Textarea
          id="nota"
          value={all.nota_diferencia ?? ""}
          onChange={(e) =>
            setValue("nota_diferencia", e.target.value, { shouldDirty: true })
          }
          placeholder={t.cuadrado
            ? "ej. faltaron $500, devolución de cliente sin registrar..."
            : "Obligatorio — explica la diferencia detectada"
          }
          maxLength={280}
          rows={3}
          className={cn(!t.cuadrado && !(all.nota_diferencia?.trim()) && "border-destructive")}
        />
        {!t.cuadrado && !(all.nota_diferencia?.trim()) && (
          <p className="text-xs text-destructive">
            Debes dejar una nota cuando hay diferencia en el cuadre.
          </p>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  positive,
  bold,
}: {
  label: string;
  value: number;
  positive?: boolean;
  bold?: boolean;
}) {
  return (
    <div className={cn("flex justify-between", bold && "font-semibold")}>
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "tabular-nums",
          positive && "text-success",
        )}
      >
        {money(value)}
      </span>
    </div>
  );
}
