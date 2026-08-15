"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { money, moneyDecimal, dateShort } from "@/lib/format";
import { cn } from "@/lib/utils";
import { eliminarCierresAction } from "./actions";
import type { CuadreRow } from "./loaders";

export function CierresTable({ rows }: { rows: CuadreRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic py-8 text-center">
        Aún no hay cierres registrados.
      </p>
    );
  }

  const allSelected = rows.length > 0 && selected.size === rows.length;
  const someSelected = selected.size > 0;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(rows.map((r) => r.id!).filter(Boolean)));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleDelete(ids: string[]) {
    const count = ids.length;
    const msg =
      count === 1
        ? "¿Eliminar este cierre? Se borrarán todas sus ventas, gastos e ingresos asociados."
        : `¿Eliminar ${count} cierres? Se borrarán todas sus ventas, gastos e ingresos asociados.`;

    if (!confirm(msg)) return;

    startTransition(async () => {
      const result = await eliminarCierresAction(ids);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.message);
        setSelected(new Set());
      }
    });
  }

  return (
    <>
      {/* Barra de acciones cuando hay seleccionados */}
      {someSelected && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 mb-3">
          <span className="text-sm font-medium">
            {selected.size} seleccionado(s)
          </span>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleDelete(Array.from(selected))}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Eliminar seleccionados
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelected(new Set())}
            disabled={isPending}
          >
            Cancelar
          </Button>
        </div>
      )}

      {/* Mobile: cards */}
      <ul className="md:hidden space-y-2">
        {rows.map((r) => {
          const id = r.id!;
          const isSelected = selected.has(id);

          return (
            <li key={id} className="relative">
              <div
                className={cn(
                  "rounded-lg border bg-card p-3",
                  isSelected && "ring-2 ring-destructive/50",
                )}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleOne(id)}
                    className="h-4 w-4 rounded border-input accent-destructive shrink-0"
                  />
                  <Link
                    href={`/dashboard/cierres/${id}`}
                    className="flex-1 min-w-0 active:opacity-70"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm">
                          {dateShort(r.fecha)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {r.empleado_nombre ?? "—"}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "size-6 rounded-full grid place-items-center",
                          r.cuadrado
                            ? "bg-success/15 text-success"
                            : "bg-destructive/15 text-destructive",
                        )}
                      >
                        {r.cuadrado ? (
                          <CheckCircle2 className="size-4" />
                        ) : (
                          <AlertTriangle className="size-4" />
                        )}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <KV label="Ventas" value={money(r.ventas_tpv_total)} />
                      <KV
                        label="Diferencia"
                        value={moneyDecimal(r.diferencia)}
                        tone={r.cuadrado ? "muted" : "destructive"}
                      />
                    </div>
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Desktop: table */}
      <div className="hidden md:block rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-input accent-destructive"
                />
              </TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Empleado</TableHead>
              <TableHead className="text-right">Ventas</TableHead>
              <TableHead className="text-right">Digital</TableHead>
              <TableHead className="text-right">Arqueo</TableHead>
              <TableHead className="text-right">Diferencia</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead aria-label="Acciones" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const id = r.id!;
              const isSelected = selected.has(id);

              return (
                <TableRow
                  key={id}
                  className={cn(
                    "hover:bg-accent/40",
                    isSelected && "bg-destructive/5",
                  )}
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOne(id)}
                      className="h-4 w-4 rounded border-input accent-destructive"
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {dateShort(r.fecha)}
                  </TableCell>
                  <TableCell>{r.empleado_nombre ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {money(r.ventas_tpv_total)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {money(r.ingresos_digitales_total)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {money(r.efectivo_arqueo)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right tabular-nums font-medium",
                      !r.cuadrado && "text-destructive",
                    )}
                  >
                    {moneyDecimal(r.diferencia)}
                  </TableCell>
                  <TableCell>
                    {r.cuadrado ? (
                      <Badge
                        variant="secondary"
                        className="bg-success/15 text-success border-success/30"
                      >
                        Cuadrado
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Descuadrado</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete([id])}
                        disabled={isPending}
                        className="text-muted-foreground hover:text-destructive p-1 rounded"
                        title="Eliminar cierre"
                      >
                        <Trash2 className="size-4" />
                      </button>
                      <Link
                        href={`/dashboard/cierres/${id}`}
                        className="text-muted-foreground hover:text-foreground p-1"
                        aria-label="Ver detalle"
                      >
                        <ChevronRight className="size-4" />
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function KV({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "muted" | "destructive";
}) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "tabular-nums font-medium",
          tone === "destructive" && "text-destructive",
          tone === "muted" && "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}
