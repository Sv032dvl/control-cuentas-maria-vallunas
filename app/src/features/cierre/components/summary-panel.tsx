"use client";

import { Banknote, ShoppingCart, Smartphone, Receipt, Coins, Calculator, TrendingUp, TrendingDown, Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { money } from "@/lib/format";
import type { CierreFormValues } from "../schema";

type Totales = {
  base: number;
  ventasTpv: number;
  digital: number;
  egresosEfectivo: number;
  arqueo: number;
  efectivoEsperado: number;
  diferencia: number;
  cuadrado: boolean;
};

type Props = {
  totales: Totales;
  formValues: Partial<CierreFormValues>;
  currentStep: number;
};

// Mapeo paso → sección resaltada
const STEP_TO_SECTION: Record<number, string> = {
  0: "base",
  1: "pizza",
  2: "ventas",
  3: "digitales",
  4: "egresos",
  5: "arqueo",
  6: "resultado",
};

function SummaryRow({
  icon: Icon,
  label,
  value,
  detail,
  active,
  sign,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  detail?: string;
  active?: boolean;
  sign?: "+" | "-";
}) {
  const hasValue = value !== 0;
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-300",
        active && "bg-primary/8 ring-1 ring-primary/20",
      )}
    >
      <span
        className={cn(
          "flex items-center justify-center size-8 rounded-lg shrink-0 transition-colors",
          active
            ? "btn-gradient shadow-sm"
            : hasValue
              ? "bg-muted"
              : "bg-muted/50",
        )}
      >
        <Icon
          className={cn(
            "size-4",
            active ? "text-primary-foreground" : hasValue ? "text-foreground" : "text-muted-foreground/50",
          )}
        />
      </span>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-xs font-medium leading-none",
            hasValue ? "text-foreground" : "text-muted-foreground/60",
          )}
        >
          {label}
        </p>
        {detail && (
          <p className="text-[10px] text-muted-foreground mt-0.5">{detail}</p>
        )}
      </div>
      <span
        className={cn(
          "text-sm font-semibold tabular-nums whitespace-nowrap",
          hasValue ? "text-foreground" : "text-muted-foreground/40",
        )}
      >
        {sign && hasValue ? (sign === "-" ? "− " : "+ ") : ""}
        {money(Math.abs(value))}
      </span>
    </div>
  );
}

export function SummaryPanel({ totales, formValues, currentStep }: Props) {
  const activeSection = STEP_TO_SECTION[currentStep];

  const productosVendidos =
    formValues.ventas?.filter((v) => (v.cantidad ?? 0) > 0).length ?? 0;
  const nDigitales = formValues.digitales?.length ?? 0;
  const nEgresos = formValues.egresos?.length ?? 0;

  return (
    <div className="sticky top-20 glass-panel rounded-2xl p-4 space-y-1">
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-3 pb-2">
        Resumen del día
      </h3>

      {/* Ingresos */}
      <SummaryRow
        icon={Banknote}
        label="Base inicial"
        value={totales.base}
        active={activeSection === "base"}
        sign="+"
      />

      <SummaryRow
        icon={ShoppingCart}
        label="Ventas TPV"
        value={totales.ventasTpv}
        detail={productosVendidos > 0 ? `${productosVendidos} productos` : undefined}
        active={activeSection === "ventas"}
        sign="+"
      />

      <SummaryRow
        icon={Smartphone}
        label="Ingresos digitales"
        value={totales.digital}
        detail={nDigitales > 0 ? `${nDigitales} transacciones` : undefined}
        active={activeSection === "digitales"}
        sign="-"
      />

      <SummaryRow
        icon={Receipt}
        label="Gastos efectivo"
        value={totales.egresosEfectivo}
        detail={nEgresos > 0 ? `${nEgresos} gastos` : undefined}
        active={activeSection === "egresos"}
        sign="-"
      />

      {/* Separador */}
      <div className="border-t border-border/40 mx-3 my-2" />

      {/* Calculados */}
      <div
        className={cn(
          "rounded-xl px-3 py-2.5 transition-all duration-300",
          activeSection === "resultado" && "bg-primary/8 ring-1 ring-primary/20",
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="size-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              Efectivo esperado
            </span>
          </div>
          <span className="text-sm font-bold tabular-nums">
            {money(totales.efectivoEsperado)}
          </span>
        </div>
      </div>

      <SummaryRow
        icon={Coins}
        label="Arqueo (contado)"
        value={totales.arqueo}
        active={activeSection === "arqueo"}
      />

      {/* Diferencia — destacada */}
      {(totales.arqueo > 0 || totales.ventasTpv > 0) && (
        <>
          <div className="border-t border-border/40 mx-3 my-2" />
          <div
            className={cn(
              "rounded-xl px-3 py-3 transition-all duration-300",
              totales.cuadrado
                ? "bg-green-100/80 dark:bg-green-950/40"
                : totales.diferencia > 0
                  ? "bg-amber-100/80 dark:bg-amber-950/40"
                  : "bg-red-100/80 dark:bg-red-950/40",
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {totales.cuadrado ? (
                  <Check className="size-4 text-green-600 dark:text-green-400" />
                ) : totales.diferencia > 0 ? (
                  <TrendingUp className="size-4 text-amber-600 dark:text-amber-400" />
                ) : (
                  <TrendingDown className="size-4 text-red-600 dark:text-red-400" />
                )}
                <span
                  className={cn(
                    "text-xs font-semibold",
                    totales.cuadrado
                      ? "text-green-700 dark:text-green-400"
                      : totales.diferencia > 0
                        ? "text-amber-700 dark:text-amber-400"
                        : "text-red-700 dark:text-red-400",
                  )}
                >
                  {totales.cuadrado ? "Cuadrado" : "Diferencia"}
                </span>
              </div>
              <span
                className={cn(
                  "text-base font-extrabold tabular-nums",
                  totales.cuadrado
                    ? "text-green-700 dark:text-green-400"
                    : totales.diferencia > 0
                      ? "text-amber-700 dark:text-amber-400"
                      : "text-red-700 dark:text-red-400",
                )}
              >
                {money(totales.diferencia)}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Ecuación explicativa */}
      <div className="px-3 pt-2">
        <p className="text-[10px] text-muted-foreground/50 leading-relaxed">
          Esperado = Base + Ventas − Digital − Gastos
        </p>
      </div>
    </div>
  );
}
