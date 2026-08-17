"use client";

import { useFormContext } from "react-hook-form";
import { Calculator, AlertTriangle, CheckCircle2, Bike } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { money, moneyDecimal } from "@/lib/format";
import { calcTotales, calcRecaudoTerceros } from "../schema";
import { cn } from "@/lib/utils";
import { LiquidacionPizzeriaCard } from "../components/liquidacion-pizzeria-card";
import type { CierreFormValues } from "../schema";
import type { CatalogProducto, CatalogUnidad } from "../loaders";

export function StepResumen({
  productos,
  unidades,
}: {
  productos: CatalogProducto[];
  unidades: CatalogUnidad[];
}) {
  const { watch, setValue } = useFormContext<CierreFormValues>();
  const all = watch();
  const t = calcTotales(all);
  const rec = calcRecaudoTerceros(all, productos, unidades);

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2.5 tracking-tight">
          <span className="flex items-center justify-center size-9 rounded-xl btn-gradient shadow-sm">
            <Calculator className="size-4 text-primary-foreground" />
          </span>
          Cuadre del día
        </h2>
        <p className="text-sm text-muted-foreground">
          Verifica los totales y deja una nota si la diferencia no es cero.
        </p>
      </div>

      <Card
        className={cn(
          "p-5 space-y-2 border rounded-2xl shadow-md transition-all",
          t.cuadrado
            ? "border-green-300/60 bg-green-50/70 dark:bg-green-950/30 dark:border-green-800/40 shadow-green-100/40 dark:shadow-green-900/10"
            : "border-red-300/60 bg-red-50/70 dark:bg-red-950/30 dark:border-red-800/40 shadow-red-100/40 dark:shadow-red-900/10",
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
        <p className="text-4xl font-extrabold tabular-nums mt-2 tracking-tight">
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

      <Card className="p-5 space-y-2.5 text-sm glass-panel rounded-2xl border-0">
        <Row label="Base inicial" value={t.base} />
        <Row label="+ Ventas TPV" value={t.ventasTpv} positive />
        <Row label="− Ingresos digitales" value={t.digital} />
        <Row label="− Gastos" value={t.egresosEfectivo} />
        <hr className="border-border my-1" />
        <Row label="= Efectivo esperado" value={t.efectivoEsperado} bold />
        <Row label="Arqueo (lo que contaste)" value={t.arqueo} bold />
      </Card>

      {rec.recaudo > 0 && (
        <Card className="p-5 space-y-2.5 text-sm glass-panel rounded-2xl border-0">
          <div className="flex items-center gap-2 mb-1">
            <Bike className="size-4 text-muted-foreground" />
            <h3 className="font-semibold">Ventas del negocio</h3>
          </div>
          <Row label="Total facturado" value={t.ventasTpv} />
          <Row label="− Domicilios (del mensajero)" value={rec.recaudo} />
          <hr className="border-border my-1" />
          <Row label="= Venta real del negocio" value={rec.ventasNegocio} bold />
          <p className="text-xs text-muted-foreground pt-1">
            El domicilio lo cobras junto con el pedido, pero esa plata es del
            mensajero. Sí entra a la caja —por eso cuenta en el cuadre de
            arriba— pero no es venta del negocio.
          </p>
        </Card>
      )}

      <LiquidacionPizzeriaCard productos={productos} />

      {!t.cuadrado && Math.abs(t.diferencia) > 10000 && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200/70 bg-amber-50/80 dark:border-amber-800/40 dark:bg-amber-950/30 px-4 py-3 shadow-sm backdrop-blur-sm">
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
    <div className={cn("flex justify-between py-0.5", bold && "font-bold text-base")}>
      <span className={cn("text-muted-foreground", bold && "text-foreground")}>{label}</span>
      <span
        className={cn(
          "tabular-nums font-medium",
          positive && "text-success",
          bold && "text-primary",
        )}
      >
        {money(value)}
      </span>
    </div>
  );
}
