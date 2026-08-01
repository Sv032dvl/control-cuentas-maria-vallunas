"use client";

import { useState, useTransition } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Loader2, Save, CheckCheck, TrendingUp, TrendingDown, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ProgressSteps, type Step } from "./components/progress-steps";
import { StepBase } from "./steps/step-base";
import { StepVentas } from "./steps/step-ventas";
import { StepDigitales } from "./steps/step-digitales";
import { StepEgresos } from "./steps/step-egresos";
import { StepArqueo } from "./steps/step-arqueo";
import { StepResumen } from "./steps/step-resumen";
import {
  cierreFullSchema,
  calcTotales,
  type CierreFormValues,
} from "./schema";
import { guardarCierre } from "./actions";
import { money } from "@/lib/format";
import type { Catalogos, CierreExistente, LoyverseData } from "./loaders";

const STEPS: Step[] = [
  { id: "base", label: "Base inicial", short: "Base" },
  { id: "ventas", label: "Ventas", short: "Ventas" },
  { id: "digitales", label: "Ingresos digitales", short: "Digital" },
  { id: "egresos", label: "Egresos", short: "Egresos" },
  { id: "arqueo", label: "Arqueo billetes", short: "Arqueo" },
  { id: "resumen", label: "Resumen y cuadre", short: "Cuadre" },
];

type Props = {
  catalogos: Catalogos;
  existente: CierreExistente;
  loyverseData: LoyverseData;
};

export function CierreWizard({ catalogos, existente, loyverseData }: Props) {
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const cerrado = existente?.estado === "cerrado";

  // Si hay borrador previo, usar sus datos. Si no, pre-llenar con Loyverse.
  const form = useForm<CierreFormValues>({
    resolver: zodResolver(cierreFullSchema),
    mode: "onChange",
    defaultValues: buildDefaults(catalogos, existente, loyverseData),
  });

  const formValues = form.watch();
  const totales = calcTotales(formValues);

  // Campos a validar por paso (solo pasos con inputs que pueden tener errores)
  const STEP_FIELDS: Record<number, (keyof CierreFormValues)[]> = {
    0: ["base_inicial"],
    2: ["digitales"],
    3: ["egresos"],
  };

  async function next() {
    const fields = STEP_FIELDS[step];
    if (fields) {
      const valid = await form.trigger(fields);
      if (!valid) {
        toast.error("Corrige los campos marcados antes de continuar.");
        return;
      }
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  const back = () => setStep((s) => Math.max(s - 1, 0));

  function handleCerrar() {
    // Validar nota obligatoria si hay descuadre
    if (!totales.cuadrado && !formValues.nota_diferencia?.trim()) {
      toast.error("Debes dejar una nota cuando hay diferencia en el cuadre.");
      return;
    }
    // Si hay diferencia, pedir confirmación
    if (!totales.cuadrado) {
      setShowConfirm(true);
      return;
    }
    save(true);
  }

  function save(cerrar: boolean) {
    if (cerrado) {
      toast.info("Este cierre ya está cerrado y no se puede modificar.");
      return;
    }
    startTransition(async () => {
      const values = form.getValues();
      const res = await guardarCierre(values, cerrar);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      if (cerrar) {
        toast.success(
          res.cuadrado
            ? "Cierre cuadrado y guardado ✓"
            : "Cierre guardado con diferencia — el admin recibirá alerta.",
        );
      } else {
        toast.success("Borrador guardado");
      }
      setShowConfirm(false);
    });
  }

  return (
    <FormProvider {...form}>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <ProgressSteps steps={STEPS} current={step} onJump={setStep} />
          {cerrado && (
            <Badge variant="secondary" className="shrink-0">
              Cerrado
            </Badge>
          )}
        </div>

        <div>
          {step === 0 && <StepBase />}
          {step === 1 && (
            <StepVentas
              productos={catalogos.productos}
              unidades={catalogos.unidades}
              loyverseData={loyverseData}
            />
          )}
          {step === 2 && (
            <StepDigitales loyverseData={loyverseData} />
          )}
          {step === 3 && (
            <StepEgresos
              categorias={catalogos.categorias}
              unidades={catalogos.unidades}
            />
          )}
          {step === 4 && <StepArqueo denominaciones={catalogos.denominaciones} />}
          {step === 5 && <StepResumen />}
        </div>

        {/* Footer fijo con acciones */}
        <div className="sticky bottom-16 md:bottom-0 z-20 -mx-4 md:-mx-8 px-4 md:px-8 py-3 border-t bg-background/95 backdrop-blur">
          {/* Indicador de diferencia en tiempo real */}
          {(totales.arqueo > 0 || totales.ventasTpv > 0) && step < 5 && (
            <div className={cn(
              "mb-2 flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              totales.cuadrado
                ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                : totales.diferencia > 0
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                  : "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400",
            )}>
              {totales.cuadrado ? (
                <Check className="size-3.5" />
              ) : totales.diferencia > 0 ? (
                <TrendingUp className="size-3.5" />
              ) : (
                <TrendingDown className="size-3.5" />
              )}
              <span>
                {totales.cuadrado
                  ? "Cuadrado"
                  : `Diferencia: ${money(totales.diferencia)}`}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={back}
              disabled={step === 0 || isPending}
              className="h-12"
            >
              <ArrowLeft className="size-4" /> Atrás
            </Button>

            <div className="ml-auto flex items-center gap-2">
              {step < STEPS.length - 1 ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => save(false)}
                    disabled={isPending || cerrado}
                    className="h-12"
                  >
                    {isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    <span className="hidden sm:inline">Guardar</span>
                  </Button>
                  <Button type="button" onClick={() => next()} className="h-12">
                    Siguiente <ArrowRight className="size-4" />
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  onClick={handleCerrar}
                  disabled={isPending || cerrado}
                  className="h-12 px-6"
                >
                  {isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CheckCheck className="size-4" />
                  )}
                  Cerrar día
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dialog de confirmación para cierre con diferencia */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar cierre con diferencia</DialogTitle>
            <DialogDescription>
              Se detectó una diferencia de{" "}
              <strong className="text-foreground">{money(totales.diferencia)}</strong>{" "}
              ({totales.diferencia > 0 ? "sobra" : "falta"} en caja).
              El administrador recibirá una alerta.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Revisar
            </Button>
            <Button
              variant="destructive"
              onClick={() => save(true)}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCheck className="size-4" />
              )}
              Cerrar con diferencia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FormProvider>
  );
}

function buildDefaults(
  catalogos: Catalogos,
  existente: CierreExistente,
  loyverseData: LoyverseData,
): CierreFormValues {
  // Llenar arqueo con todas las denominaciones (cantidad 0 si no existe).
  const arqueoMap = new Map(
    existente?.arqueo.map((a) => [a.denominacion_id, a.cantidad]) ?? [],
  );
  const arqueo = catalogos.denominaciones.map((d) => ({
    denominacion_id: d.id,
    valor: d.valor,
    cantidad: arqueoMap.get(d.id) ?? 0,
  }));

  // Si hay borrador previo, usar sus datos (el empleado ya trabajó en esto).
  if (existente) {
    return {
      base_inicial: existente.base_inicial,
      ventas: existente.ventas,
      digitales: existente.digitales.map((d) => ({
        metodo: d.metodo,
        monto: d.monto,
        descripcion: d.descripcion ?? "",
      })),
      egresos: existente.egresos,
      arqueo,
      nota_diferencia: existente.nota_diferencia ?? "",
    };
  }

  // Cierre nuevo: pre-llenar con Loyverse si hay datos disponibles.
  return {
    base_inicial: 0,
    ventas: loyverseData?.ventas ?? [],
    digitales: loyverseData?.digitales.map((d) => ({
      metodo: d.metodo,
      monto: d.monto,
      descripcion: d.descripcion,
    })) ?? [],
    egresos: [],
    arqueo,
    nota_diferencia: "",
  };
}
