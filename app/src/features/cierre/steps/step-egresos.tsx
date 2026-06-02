"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import { Receipt, Plus, Trash2 } from "lucide-react";
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
import type { CatalogCategoria, CatalogUnidad } from "../loaders";
import type { CierreFormValues } from "../schema";

type Props = {
  categorias: CatalogCategoria[];
  unidades: CatalogUnidad[];
};

export function StepEgresos({ categorias, unidades }: Props) {
  const { control, watch, setValue } = useFormContext<CierreFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "egresos",
  });
  const egresos = watch("egresos");
  const totalEfectivo = egresos
    .filter((e) => e.metodo_pago === "efectivo")
    .reduce((acc, e) => acc + (e.monto || 0), 0);
  const totalTransfer = egresos
    .filter((e) => e.metodo_pago === "transferencia")
    .reduce((acc, e) => acc + (e.monto || 0), 0);

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Receipt className="size-5 text-primary" /> Egresos del día
        </h2>
        <p className="text-sm text-muted-foreground">
          Gastos pagados desde la caja o por transferencia.
        </p>
      </div>

      <ul className="space-y-3">
        {fields.map((field, idx) => (
          <li key={field.id}>
            <Card className="p-3 space-y-3">
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Concepto</Label>
                  <Input
                    value={egresos[idx]?.concepto ?? ""}
                    onChange={(e) =>
                      setValue(`egresos.${idx}.concepto`, e.target.value, {
                        shouldDirty: true,
                      })
                    }
                    placeholder="ej. queso, propina..."
                  />
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Categoría</Label>
                  <Select
                    value={egresos[idx]?.categoria_id ?? ""}
                    onValueChange={(v) =>
                      setValue(`egresos.${idx}.categoria_id`, v ?? "", {
                        shouldDirty: true,
                      })
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="capitalize">
                          {c.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Unidad</Label>
                  <Select
                    value={egresos[idx]?.unidad_id ?? ""}
                    onValueChange={(v) =>
                      setValue(`egresos.${idx}.unidad_id`, v ?? "", {
                        shouldDirty: true,
                      })
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      {unidades.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Método</Label>
                  <Select
                    value={egresos[idx]?.metodo_pago}
                    onValueChange={(v) =>
                      setValue(
                        `egresos.${idx}.metodo_pago`,
                        (v ?? "efectivo") as "efectivo" | "transferencia",
                        { shouldDirty: true },
                      )
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Monto</Label>
                  <MoneyInput
                    value={egresos[idx]?.monto ?? 0}
                    onValueChange={(n) =>
                      setValue(`egresos.${idx}.monto`, n, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  />
                </div>
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
          append({
            concepto: "",
            categoria_id: "",
            unidad_id: "",
            monto: 0,
            metodo_pago: "efectivo",
          })
        }
      >
        <Plus className="size-4" /> Añadir egreso
      </Button>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Efectivo</p>
          <p className="text-lg font-bold tabular-nums">{money(totalEfectivo)}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Transferencia</p>
          <p className="text-lg font-bold tabular-nums">{money(totalTransfer)}</p>
        </Card>
      </div>
    </div>
  );
}
