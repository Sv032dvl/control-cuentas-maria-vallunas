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
import type { CatalogCuentaDigital, LoyverseData } from "../loaders";

type Props = {
  cuentas: CatalogCuentaDigital[];
  loyverseData: LoyverseData;
};

export function StepDigitales({ cuentas, loyverseData }: Props) {
  const { control, watch, setValue } = useFormContext<CierreFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "digitales",
  });
  const digitales = watch("digitales");
  const total = digitales.reduce((acc, d) => acc + (d.monto || 0), 0);
  const cuentaItems = cuentas.map((c) => ({ value: c.id, label: c.nombre }));

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2.5 tracking-tight">
          <span className="flex items-center justify-center size-9 rounded-xl btn-gradient shadow-sm">
            <Smartphone className="size-4 text-primary-foreground" />
          </span>
          Ingresos digitales
        </h2>
        <p className="text-sm text-muted-foreground">
          Registra el total recibido en cada cuenta digital.
        </p>
        {loyverseData && loyverseData.totalDigital > 0 && (
          <div className="flex items-center gap-2 rounded-2xl border border-blue-200/70 bg-blue-50/80 dark:border-blue-800/40 dark:bg-blue-950/30 px-3.5 py-2.5 shadow-sm backdrop-blur-sm">
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
            <Card className="p-4 space-y-3 glass-panel rounded-2xl border-0">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Label className="text-xs">Cuenta</Label>
                  <Select
                    items={cuentaItems}
                    value={digitales[idx]?.cuenta_digital_id}
                    onValueChange={(v) =>
                      setValue(`digitales.${idx}.cuenta_digital_id`, v ?? "", {
                        shouldDirty: true,
                      })
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Selecciona cuenta…" />
                    </SelectTrigger>
                    <SelectContent>
                      {cuentas.map((c) => (
                        <SelectItem key={c.id} value={c.id} label={c.nombre}>
                          {c.nombre}
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
        className="w-full h-12 rounded-2xl border-dashed border-2 hover:border-primary/40 hover:bg-primary/5 transition-all"
        onClick={() =>
          append({ cuenta_digital_id: "", monto: 0, descripcion: "" })
        }
      >
        <Plus className="size-4" /> Añadir ingreso
      </Button>

      <Card className="p-4 flex items-center justify-between glass-panel rounded-2xl border-0">
        <span className="text-sm text-muted-foreground font-medium">Total digital</span>
        <span className="text-xl font-bold tabular-nums text-primary">{money(total)}</span>
      </Card>
    </div>
  );
}
