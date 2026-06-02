"use client";

import { useState, useTransition } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Loader2, Save, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressSteps, type Step } from "./components/progress-steps";
import { StepBase } from "./steps/step-base";
import { StepVentas } from "./steps/step-ventas";
import { StepDigitales } from "./steps/step-digitales";
import { StepEgresos } from "./steps/step-egresos";
import { StepArqueo } from "./steps/step-arqueo";
import { StepResumen } from "./steps/step-resumen";
import {
  cierreFullSchema,
  type CierreFormValues,
} from "./schema";
import { guardarCierre } from "./actions";
import type { Catalogos, CierreExistente } from "./loaders";

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
};

export function CierreWizard({ catalogos, existente }: Props) {
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const cerrado = existente?.estado === "cerrado";

  const form = useForm<CierreFormValues>({
    resolver: zodResolver(cierreFullSchema),
    mode: "onChange",
    defaultValues: buildDefaults(catalogos, existente),
  });

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

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
            />
          )}
          {step === 2 && <StepDigitales />}
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
                  <Button type="button" onClick={next} className="h-12">
                    Siguiente <ArrowRight className="size-4" />
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  onClick={() => save(true)}
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
    </FormProvider>
  );
}

function buildDefaults(
  catalogos: Catalogos,
  existente: CierreExistente,
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

  return {
    base_inicial: existente?.base_inicial ?? 0,
    ventas: existente?.ventas ?? [],
    digitales: existente?.digitales.map((d) => ({
      metodo: d.metodo,
      monto: d.monto,
      descripcion: d.descripcion ?? "",
    })) ?? [],
    egresos: existente?.egresos ?? [],
    arqueo,
    nota_diferencia: existente?.nota_diferencia ?? "",
  };
}
