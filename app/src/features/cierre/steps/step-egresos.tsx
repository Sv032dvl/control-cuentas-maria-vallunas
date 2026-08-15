"use client";

import { useRef } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { Receipt, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MoneyInput } from "../components/money-input";
import { money } from "@/lib/format";
import type { CatalogCategoria, CatalogUnidad } from "../loaders";
import type { CierreFormValues } from "../schema";

type Props = {
  categorias: CatalogCategoria[];
  unidades: CatalogUnidad[];
  /** Llamado al agregar/eliminar fila para forzar guardado inmediato a DB. */
  onStructuralChange?: () => void;
};

/** Resuelve el nombre de un catálogo por su ID (evita que Base UI muestre el UUID). */
function resolveName(items: { id: string; nombre: string }[], id: string | undefined): string | undefined {
  if (!id) return undefined;
  return items.find((item) => item.id === id)?.nombre;
}

export function StepEgresos({ categorias, unidades, onStructuralChange }: Props) {
  const { control, watch, setValue } = useFormContext<CierreFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "egresos",
  });
  const egresos = watch("egresos");
  const total = egresos.reduce((acc, e) => acc + (e.monto || 0), 0);
  const lastConceptoRef = useRef<HTMLInputElement>(null);

  function addRow() {
    append({
      concepto: "",
      categoria_id: "",
      unidad_id: "",
      monto: 0,
      metodo_pago: "efectivo",
    });
    // Focus new row's concepto after render
    setTimeout(() => lastConceptoRef.current?.focus(), 50);
    // Guardado inmediato para no perder la estructura
    setTimeout(() => onStructuralChange?.(), 100);
  }

  function removeRow(idx: number) {
    remove(idx);
    // Guardado inmediato tras eliminar
    setTimeout(() => onStructuralChange?.(), 100);
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2.5 tracking-tight">
          <span className="flex items-center justify-center size-9 rounded-xl btn-gradient shadow-sm">
            <Receipt className="size-4 text-primary-foreground" />
          </span>
          Gastos del día
        </h2>
        <p className="text-sm text-muted-foreground">
          Gastos pagados desde la caja.
        </p>
      </div>

      {fields.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-sm text-muted-foreground">Sin gastos registrados</p>
          <Button
            type="button"
            variant="outline"
            onClick={addRow}
            className="h-11 rounded-2xl border-dashed border-2 px-6"
          >
            <Plus className="size-4" /> Añadir gasto
          </Button>
        </div>
      ) : (
        <>
          {/* ── Desktop: Tabla inline ── */}
          <div className="hidden sm:block glass-panel rounded-2xl border-0 overflow-hidden">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-border/50">
                  <TableHead className="text-xs uppercase tracking-wide text-muted-foreground font-semibold pl-3 w-[45%]">Descripción</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-muted-foreground font-semibold w-[18.3%]">Categoría</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-muted-foreground font-semibold w-[18.3%]">Unidad</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-muted-foreground font-semibold w-[18.3%] text-right">Monto</TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, idx) => {
                  const catName = resolveName(categorias, egresos[idx]?.categoria_id);
                  const uniName = resolveName(unidades, egresos[idx]?.unidad_id);
                  return (
                    <TableRow
                      key={field.id}
                      className="group border-b border-border/30 hover:bg-primary/[0.03] transition-colors"
                    >
                      <TableCell className="pl-3 py-1.5 overflow-hidden">
                        <Input
                          ref={idx === fields.length - 1 ? lastConceptoRef : undefined}
                          value={egresos[idx]?.concepto ?? ""}
                          onChange={(e) =>
                            setValue(`egresos.${idx}.concepto`, e.target.value, {
                              shouldDirty: true,
                            })
                          }
                          placeholder="ej. queso, propina..."
                          className="h-9 w-full border-0 bg-transparent shadow-none focus-visible:ring-1 focus-visible:ring-primary/40 rounded-lg px-2"
                        />
                      </TableCell>
                      <TableCell className="py-1.5 overflow-hidden">
                        <Select
                          value={egresos[idx]?.categoria_id ?? ""}
                          onValueChange={(v) =>
                            setValue(`egresos.${idx}.categoria_id`, v ?? "", {
                              shouldDirty: true,
                            })
                          }
                        >
                          <SelectTrigger className="h-9 w-full border-0 bg-transparent shadow-none focus:ring-1 focus:ring-primary/40 rounded-lg text-sm [&>span]:truncate">
                            <SelectValue placeholder="—">{catName}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {categorias.map((c) => (
                              <SelectItem key={c.id} value={c.id} className="capitalize">
                                {c.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="py-1.5 overflow-hidden">
                        <Select
                          value={egresos[idx]?.unidad_id ?? ""}
                          onValueChange={(v) =>
                            setValue(`egresos.${idx}.unidad_id`, v ?? "", {
                              shouldDirty: true,
                            })
                          }
                        >
                          <SelectTrigger className="h-9 w-full border-0 bg-transparent shadow-none focus:ring-1 focus:ring-primary/40 rounded-lg text-sm [&>span]:truncate">
                            <SelectValue placeholder="—">{uniName}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {unidades.map((u) => (
                              <SelectItem key={u.id} value={u.id}>
                                {u.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="py-1.5 overflow-hidden">
                        <MoneyInput
                          value={egresos[idx]?.monto ?? 0}
                          onValueChange={(n) =>
                            setValue(`egresos.${idx}.monto`, n, {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                          }
                          className="h-9 !rounded-lg border-0 bg-transparent shadow-none focus-within:ring-1 focus-within:ring-primary/40"
                        />
                      </TableCell>
                      <TableCell className="py-1.5 pr-2">
                        <button
                          type="button"
                          onClick={() => removeRow(idx)}
                          className="size-7 inline-flex items-center justify-center rounded-md text-muted-foreground/50 opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
                          aria-label="Eliminar"
                        >
                          <X className="size-3.5" />
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter className="bg-transparent border-t border-border/50">
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={3} className="pl-3 py-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={addRow}
                      className="h-8 text-xs text-muted-foreground hover:text-primary"
                    >
                      <Plus className="size-3.5" /> Añadir gasto
                    </Button>
                  </TableCell>
                  <TableCell className="py-2 text-right">
                    <span className="text-sm font-bold tabular-nums">{money(total)}</span>
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          </div>

          {/* ── Mobile: Filas compactas ── */}
          <div className="sm:hidden space-y-2">
            {fields.map((field, idx) => (
              <MobileEgresoRow
                key={field.id}
                idx={idx}
                egresos={egresos}
                categorias={categorias}
                unidades={unidades}
                setValue={setValue}
                onRemove={() => removeRow(idx)}
              />
            ))}
            <div className="flex items-center justify-between pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRow}
                className="h-9 rounded-xl border-dashed border-2 text-xs"
              >
                <Plus className="size-3.5" /> Añadir
              </Button>
              <span className="text-sm font-bold tabular-nums">
                Total: {money(total)}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Mobile Row Component ── */

function MobileEgresoRow({
  idx,
  egresos,
  categorias,
  unidades,
  setValue,
  onRemove,
}: {
  idx: number;
  egresos: CierreFormValues["egresos"];
  categorias: CatalogCategoria[];
  unidades: CatalogUnidad[];
  setValue: ReturnType<typeof useFormContext<CierreFormValues>>["setValue"];
  onRemove: () => void;
}) {
  const egreso = egresos[idx];
  const catName = resolveName(categorias, egreso?.categoria_id);
  const uniName = resolveName(unidades, egreso?.unidad_id);

  return (
    <div className="glass-panel rounded-xl p-3 space-y-2.5">
      {/* Línea 1: Concepto + delete */}
      <div className="flex items-center gap-2">
        <Input
          value={egreso?.concepto ?? ""}
          onChange={(e) =>
            setValue(`egresos.${idx}.concepto`, e.target.value, {
              shouldDirty: true,
            })
          }
          placeholder="ej. queso, propina..."
          className="h-9 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-1 focus-visible:ring-primary/40 rounded-lg px-2 text-sm"
        />
        <button
          type="button"
          onClick={onRemove}
          className="size-7 shrink-0 inline-flex items-center justify-center rounded-md text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all"
          aria-label="Eliminar"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {/* Línea 2: Categoría + Unidad */}
      <div className="grid grid-cols-2 gap-2">
        <Select
          value={egreso?.categoria_id ?? ""}
          onValueChange={(v) =>
            setValue(`egresos.${idx}.categoria_id`, v ?? "", {
              shouldDirty: true,
            })
          }
        >
          <SelectTrigger className="h-8 text-xs border-border/50 rounded-lg bg-muted/30 [&>span]:truncate">
            <SelectValue placeholder="Categoría">{catName}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {categorias.map((c) => (
              <SelectItem key={c.id} value={c.id} className="capitalize text-sm">
                {c.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={egreso?.unidad_id ?? ""}
          onValueChange={(v) =>
            setValue(`egresos.${idx}.unidad_id`, v ?? "", {
              shouldDirty: true,
            })
          }
        >
          <SelectTrigger className="h-8 text-xs border-border/50 rounded-lg bg-muted/30 [&>span]:truncate">
            <SelectValue placeholder="Unidad">{uniName}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {unidades.map((u) => (
              <SelectItem key={u.id} value={u.id} className="text-sm">
                {u.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Línea 3: Monto */}
      <MoneyInput
        value={egreso?.monto ?? 0}
        onValueChange={(n) =>
          setValue(`egresos.${idx}.monto`, n, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
        className="h-9 !rounded-lg"
      />
    </div>
  );
}
