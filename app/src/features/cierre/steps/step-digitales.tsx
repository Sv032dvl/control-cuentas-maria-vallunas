"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import { Smartphone, Plus, Trash2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoneyInput } from "../components/money-input";
import { money } from "@/lib/format";
import type { CierreFormValues } from "../schema";
import type { LoyverseData } from "../loaders";

const METODOS = [
  { v: "nequi", label: "Nequi" },
  { v: "transferencia", label: "Transferencia" },
  { v: "datafono", label: "Datáfono" },
] as const;

type Props = { loyverseData: LoyverseData };

export function StepDigitales({ loyverseData }: Props) {
  const { control, watch, setValue } = useFormContext<CierreFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "digitales",
  });
  const digitales = watch("digitales");
  const total = digitales.reduce((acc, d) => acc + (d.monto || 0), 0);

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Smartphone className="size-5 text-primary" /> Ingresos digitales
        </h2>
        <p className="text-sm text-muted-foreground">
          Pagos por Nequi, transferencia o datáfono.
        </p>
        {loyverseData && loyverseData.totalDigital > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30 px-3 py-2">
            <Zap className="size-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Datáfono importado del TPV — {money(loyverseData.totalDigital)}
            </p>
          </div>
        )}
      </div>

      <ul className="space-y-3">
        {fields.map((field, idx) => (
          <li key={field.id}>
            <Card className="p-3 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Label className="text-xs">Método</Label>
                  <Select
                    value={digitales[idx]?.metodo}
                    onValueChange={(v) =>
                      setValue(
                        `digitales.${idx}.metodo`,
                        (v ?? "nequi") as "nequi" | "transferencia" | "datafono",
                        { shouldDirty: true },
                      )
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Selecciona…" />
                    </SelectTrigger>
                    <SelectContent>
                      {METODOS.map((m) => (
                        <SelectItem key={m.v} value={m.v}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(idx)}
                  className="self-end size-10 text-muted-foreground hover:text-destructive"
                  aria-label="Eliminar"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              <div>
                <Label className="text-xs">Monto</Label>
                <MoneyInput
                  size="lg"
                  value={digitales[idx]?.monto ?? 0}
                  onValueChange={(n) =>
                    setValue(`digitales.${idx}.monto`, n, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                />
              </div>

              <div>
                <Label className="text-xs">Nota (opcional)</Label>
                <Input
                  value={digitales[idx]?.descripcion ?? ""}
                  onChange={(e) =>
                    setValue(`digitales.${idx}.descripcion`, e.target.value, {
                      shouldDirty: true,
                    })
                  }
                  placeholder="ej. Cliente Juan"
                />
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <Button
        type="button"
        variant="outline"
        className="w-full h-12"
        onClick={() =>
          append({ metodo: "nequi", monto: 0, descripcion: "" })
        }
      >
        <Plus className="size-4" /> Añadir ingreso
      </Button>

      <Card className="p-3 flex items-center justify-between bg-secondary">
        <span className="text-sm text-muted-foreground">Total digital</span>
        <span className="text-lg font-bold tabular-nums">{money(total)}</span>
      </Card>
    </div>
  );
}
