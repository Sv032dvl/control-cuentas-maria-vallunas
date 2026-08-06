"use client";

import { useState, useTransition, useEffect, useRef } from "react";
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
import { StepPizza } from "./steps/step-pizza";
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
import { useAutoSave } from "./hooks/use-auto-save";
import { SaveStatusIndicator } from "./components/save-status";
import { RestoreDraftBanner } from "./components/restore-draft-banner";
import { money } from "@/lib/format";
import { SummaryPanel } from "./components/summary-panel";
import type { Catalogos, CierreExistente, LoyverseData, PizzaExistente } from "./loaders";

const STEPS: Step[] = [
  { id: "base", label: "Base inicial", short: "Base" },
  { id: "pizza", label: "Inventario pizza", short: "Pizza" },
  { id: "ventas", label: "Ventas", short: "Ventas" },
  { id: "digitales", label: "Ingresos digitales", short: "Digital" },
  { id: "egresos", label: "Egresos", short: "Egresos" },
  { id: "arqueo", label: "Arqueo de caja", short: "Arqueo" },
  { id: "resumen", label: "Resumen y cuadre", short: "Cuadre" },
];

type Props = {
  catalogos: Catalogos;
  existente: CierreExistente;
  loyverseData: LoyverseData;
  pizzaExistente: PizzaExistente;
  fecha: string;
  userId: string;
};

export function CierreWizard({ catalogos, existente, loyverseData, pizzaExistente, fecha, userId }: Props) {
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const cerrado = existente?.estado === "cerrado";

  // Si hay borrador previo, usar sus datos. Si no, pre-llenar con Loyverse.
  const form = useForm<CierreFormValues>({
    resolver: zodResolver(cierreFullSchema),
    mode: "onChange",
    defaultValues: buildDefaults(catalogos, existente, loyverseData, pizzaExistente),
  });

  // Resetear formulario cuando cambia la fecha (navegación entre días)
  const prevFechaRef = useRef(fecha);
  useEffect(() => {
    if (prevFechaRef.current !== fecha) {
      prevFechaRef.current = fecha;
      form.reset(buildDefaults(catalogos, existente, loyverseData, pizzaExistente));
      setStep(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha]);

  const autoSave = useAutoSave({
    form,
    step,
    fecha,
    userId,
    cerrado,
    dbUpdatedAt: existente?.updated_at ?? null,
  });

  const formValues = form.watch();
  const totales = calcTotales(formValues);

  // Campos a validar por paso (solo pasos con inputs que pueden tener errores)
  const STEP_FIELDS: Record<number, (keyof CierreFormValues)[]> = {
    0: ["base_billetes", "base_monedas"],
    3: ["digitales"],
    4: ["egresos"],
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
    // Paso 0: exigir confirmación de la base (solo si hay monto > 0)
    if (step === 0) {
      const baseTotal = (form.getValues("base_billetes") ?? 0) + (form.getValues("base_monedas") ?? 0);
      if (baseTotal > 0 && !form.getValues("base_confirmado")) {
        toast.error("Confirma el total de la base antes de continuar.");
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
      const res = await guardarCierre(values, cerrar, fecha);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      autoSave.notifyManualSave();
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
        {/* Header: ProgressSteps (ancho completo, por encima de las columnas) */}
        <div className="flex items-center justify-between gap-3">
          <ProgressSteps steps={STEPS} current={step} onJump={setStep} />
          {cerrado && (
            <Badge variant="secondary" className="shrink-0">
              Cerrado
            </Badge>
          )}
        </div>

        {autoSave.localDraft && !cerrado && (
          <RestoreDraftBanner
            draft={autoSave.localDraft}
            stepLabels={STEPS.map((s) => s.label)}
            onRestore={() => {
              autoSave.restoreLocalDraft();
              if (autoSave.localDraft) setStep(autoSave.localDraft.step);
            }}
            onDiscard={autoSave.discardLocalDraft}
          />
        )}

        {/* Dos columnas: wizard + panel resumen */}
        <div className="flex gap-6">
        {/* Columna izquierda: wizard */}
        <div className="flex-1 min-w-0 space-y-5">
        <div>
          {step === 0 && <StepBase />}
          {step === 1 && <StepPizza />}
          {step === 2 && (
            <StepVentas
              productos={catalogos.productos}
              unidades={catalogos.unidades}
              loyverseData={loyverseData}
              fecha={fecha}
            />
          )}
          {step === 3 && (
            <StepDigitales loyverseData={loyverseData} />
          )}
          {step === 4 && (
            <StepEgresos
              categorias={catalogos.categorias}
              unidades={catalogos.unidades}
            />
          )}
          {step === 5 && <StepArqueo denominaciones={catalogos.denominaciones} />}
          {step === 6 && <StepResumen />}
        </div>

        {/* Footer fijo con acciones */}
        <div className="sticky bottom-0 z-20 -mx-4 md:-mx-6 px-4 md:px-6 py-3 glass-panel-lg rounded-t-2xl border-t-0">
          {!cerrado && (
            <div className="mb-1 flex justify-end">
              <SaveStatusIndicator status={autoSave.status} lastSavedAt={autoSave.lastSavedAt} />
            </div>
          )}
          {/* Indicador de diferencia en tiempo real */}
          {(totales.arqueo > 0 || totales.ventasTpv > 0) && step < 6 && (
            <div className="flex justify-center mb-2.5"><div className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all shadow-sm",
              totales.cuadrado
                ? "bg-green-100/90 text-green-700 dark:bg-green-950/50 dark:text-green-400 shadow-green-200/30 dark:shadow-green-900/20"
                : totales.diferencia > 0
                  ? "bg-amber-100/90 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 shadow-amber-200/30 dark:shadow-amber-900/20"
                  : "bg-red-100/90 text-red-700 dark:bg-red-950/50 dark:text-red-400 shadow-red-200/30 dark:shadow-red-900/20",
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
            </div></div>
          )}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={back}
              disabled={step === 0 || isPending}
              className="h-12 rounded-xl shadow-sm"
            >
              <ArrowLeft className="size-4" /> Atrás
            </Button>

            <div className="ml-auto flex items-center gap-2">
              {step < STEPS.length - 1 ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => save(false)}
                    disabled={isPending || cerrado}
                    className="h-12 rounded-xl shadow-sm"
                  >
                    {isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    <span className="hidden sm:inline">Guardar</span>
                  </Button>
                  <Button type="button" onClick={() => next()} className="h-12 rounded-xl btn-gradient border-0 px-6 font-semibold">
                    Siguiente <ArrowRight className="size-4" />
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  onClick={handleCerrar}
                  disabled={isPending || cerrado}
                  className="h-12 px-8 rounded-xl btn-gradient border-0 font-semibold text-base"
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

        {/* Columna derecha: panel resumen (solo tablet+) */}
        <aside className="hidden md:block w-72 shrink-0">
          <SummaryPanel totales={totales} formValues={formValues} currentStep={step} />
        </aside>
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
  pizzaExistente: PizzaExistente,
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
    // Fallback para cierres viejos sin desglose: asumir todo billetes
    const billetes =
      existente.base_billetes > 0 || existente.base_monedas > 0
        ? existente.base_billetes
        : existente.base_inicial;
    const monedas =
      existente.base_billetes > 0 || existente.base_monedas > 0
        ? existente.base_monedas
        : 0;

    return {
      base_billetes: billetes,
      base_monedas: monedas,
      base_inicial: existente.base_inicial,
      base_confirmado: true, // ya guardado = ya confirmado
      base_editado: existente.base_editado ?? false,
      pizza_ruedas_inicio: pizzaExistente?.ruedas_inicio ?? 0,
      pizza_porciones_inicio: pizzaExistente?.porciones_inicio ?? 0,
      pizza_horneada: pizzaExistente?.horneada ?? 0,
      pizza_ruedas_final: pizzaExistente?.ruedas_final ?? 0,
      pizza_porciones_final: pizzaExistente?.porciones_final ?? 0,
      pizza_notas: pizzaExistente?.notas ?? "",
      ventas: existente.ventas,
      digitales: existente.digitales.map((d) => ({
        metodo: d.metodo,
        monto: d.monto,
        descripcion: d.descripcion ?? "",
      })),
      egresos: existente.egresos,
      arqueo,
      arqueo_monedas: existente.arqueo_monedas ?? 0,
      nota_diferencia: existente.nota_diferencia ?? "",
    };
  }

  // Cierre nuevo: ventas vacías (el empleado importa del TPV manualmente).
  // Digitales sí se pre-llenan (datafono).
  return {
    base_billetes: 0,
    base_monedas: 0,
    base_inicial: 0,
    base_confirmado: false,
    base_editado: false,
    pizza_ruedas_inicio: pizzaExistente?.ruedas_inicio ?? 0,
    pizza_porciones_inicio: pizzaExistente?.porciones_inicio ?? 0,
    pizza_horneada: pizzaExistente?.horneada ?? 0,
    pizza_ruedas_final: pizzaExistente?.ruedas_final ?? 0,
    pizza_porciones_final: pizzaExistente?.porciones_final ?? 0,
    pizza_notas: pizzaExistente?.notas ?? "",
    ventas: [],
    digitales: loyverseData?.digitales.map((d) => ({
      metodo: d.metodo,
      monto: d.monto,
      descripcion: d.descripcion,
    })) ?? [],
    egresos: [],
    arqueo,
    arqueo_monedas: 0,
    nota_diferencia: "",
  };
}
