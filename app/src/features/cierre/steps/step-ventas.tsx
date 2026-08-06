"use client";

import { useMemo, useState, useTransition } from "react";
import { useFormContext } from "react-hook-form";
import {
  ShoppingBag,
  Zap,
  RefreshCw,
  Download,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { QtySheet } from "../components/qty-sheet";
import { money } from "@/lib/format";
import { importarVentasLoyverse } from "../actions";
import type {
  CatalogProducto,
  CatalogUnidad,
  LoyverseData,
} from "../loaders";
import type { CierreFormValues } from "../schema";

type Props = {
  productos: CatalogProducto[];
  unidades: CatalogUnidad[];
  loyverseData: LoyverseData;
  fecha: string;
};

export function StepVentas({ productos, unidades, loyverseData, fecha }: Props) {
  const { watch, setValue } = useFormContext<CierreFormValues>();
  const ventas = watch("ventas");
  const [imported, setImported] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selectedUnidad, setSelectedUnidad] = useState<string | null>(null);
  const [sheetProduct, setSheetProduct] = useState<CatalogProducto | null>(null);

  const unidadById = useMemo(
    () => Object.fromEntries(unidades.map((u) => [u.id, u.nombre])),
    [unidades],
  );

  // Agrupar productos por unidad
  const grupos = useMemo(() => {
    const m = new Map<string, CatalogProducto[]>();
    for (const p of productos) {
      const list = m.get(p.unidad_id) ?? [];
      list.push(p);
      m.set(p.unidad_id, list);
    }
    return Array.from(m.entries());
  }, [productos]);

  // IDs de productos con venta
  const idsConVenta = useMemo(() => {
    const s = new Set<string>();
    for (const v of ventas) {
      if (v.cantidad > 0) s.add(v.producto_id);
    }
    return s;
  }, [ventas]);

  // Productos filtrados
  const productosFiltrados = useMemo(() => {
    if (!selectedUnidad) {
      return productos.filter((p) => idsConVenta.has(p.id));
    }
    return productos.filter((p) => p.unidad_id === selectedUnidad);
  }, [productos, selectedUnidad, idsConVenta]);

  // Conteo de productos con venta por unidad
  const ventasPorUnidad = useMemo(() => {
    const counts = new Map<string, number>();
    for (const v of ventas) {
      if (v.cantidad > 0) {
        const prod = productos.find((p) => p.id === v.producto_id);
        if (prod) {
          counts.set(prod.unidad_id, (counts.get(prod.unidad_id) ?? 0) + 1);
        }
      }
    }
    return counts;
  }, [ventas, productos]);

  function getCantidad(productoId: string): number {
    return ventas.find((v) => v.producto_id === productoId)?.cantidad ?? 0;
  }

  function setCantidad(productoId: string, cantidad: number, precio: number) {
    const next = ventas.filter((v) => v.producto_id !== productoId);
    if (cantidad > 0) {
      next.push({ producto_id: productoId, cantidad, precio_unitario: precio });
    }
    setValue("ventas", next, { shouldDirty: true, shouldValidate: true });
  }

  const total = ventas.reduce(
    (acc, v) => acc + v.cantidad * v.precio_unitario,
    0,
  );

  const hasVentas = ventas.some((v) => v.cantidad > 0);
  const productosConVenta = ventas.filter((v) => v.cantidad > 0).length;

  function handleImportar() {
    startTransition(async () => {
      const data = await importarVentasLoyverse(fecha);
      if (!data || data.ventas.length === 0) {
        toast.info("No se encontraron ventas en el TPV para esta fecha.");
        return;
      }
      setValue("ventas", data.ventas, { shouldDirty: true, shouldValidate: true });
      setImported(true);
      toast.success(`${data.ventas.length} producto(s) importados del TPV`);
    });
  }

  const sheetQty = sheetProduct ? getCantidad(sheetProduct.id) : 0;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2.5 tracking-tight">
          <span className="flex items-center justify-center size-9 rounded-xl btn-gradient shadow-sm">
            <ShoppingBag className="size-4 text-primary-foreground" />
          </span>
          Ventas del día
        </h2>
        <p className="text-sm text-muted-foreground">
          Selecciona una categoría y registra las cantidades vendidas.
        </p>
      </div>

      {/* Botón importar o banner con actualizar */}
      {!hasVentas && loyverseData !== null ? (
        <Button
          type="button"
          className="w-full h-12 rounded-2xl btn-gradient border-0 font-semibold text-base shadow-md"
          onClick={handleImportar}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          Importar ventas del TPV
        </Button>
      ) : hasVentas ? (
        <div className="flex items-center gap-2 rounded-2xl border border-blue-200/70 bg-blue-50/80 dark:border-blue-800/40 dark:bg-blue-950/30 px-3.5 py-2.5 shadow-sm backdrop-blur-sm">
          <Zap className="size-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <p className="text-xs text-blue-700 dark:text-blue-300 flex-1">
            {productosConVenta} producto(s) con ventas — {money(total)}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50"
            onClick={handleImportar}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            <span className="text-xs">Actualizar</span>
          </Button>
        </div>
      ) : null}

      {/* Pills de categoría */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
        <button
          type="button"
          onClick={() => setSelectedUnidad(null)}
          className={cn(
            "shrink-0 rounded-full px-3.5 py-2 text-xs font-medium transition-all",
            selectedUnidad === null
              ? "btn-gradient shadow-sm"
              : "bg-muted/70 text-muted-foreground hover:bg-muted/90 backdrop-blur-sm",
          )}
        >
          Venta
          {productosConVenta > 0 && (
            <span className="ml-1 opacity-70">({productosConVenta})</span>
          )}
        </button>
        {grupos.map(([unidadId]) => {
          const count = ventasPorUnidad.get(unidadId) ?? 0;
          const isActive = selectedUnidad === unidadId;
          return (
            <button
              key={unidadId}
              type="button"
              onClick={() => setSelectedUnidad(unidadId)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-2 text-xs font-medium transition-all",
                isActive
                  ? "btn-gradient shadow-sm"
                  : count > 0
                    ? "bg-muted/70 text-foreground ring-1 ring-primary/30 backdrop-blur-sm shadow-sm"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted/90 backdrop-blur-sm",
              )}
            >
              {unidadById[unidadId] ?? "—"}
              {count > 0 && (
                <span className="ml-1 opacity-70">({count})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tabla de productos — Desktop */}
      {productosFiltrados.length > 0 ? (
        <>
          <div className="hidden sm:block glass-panel rounded-2xl overflow-hidden">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-border/50">
                  <TableHead className="w-[40%] text-xs font-semibold">Artículo</TableHead>
                  <TableHead className="w-[15%] text-xs font-semibold text-right">P. Unit</TableHead>
                  <TableHead className="w-[20%] text-xs font-semibold text-center">Cantidad</TableHead>
                  <TableHead className="w-[15%] text-xs font-semibold text-right">Total</TableHead>
                  <TableHead className="w-[10%]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {productosFiltrados.map((p) => {
                  const qty = getCantidad(p.id);
                  const rowTotal = qty * Number(p.precio);
                  const active = qty > 0;
                  return (
                    <TableRow
                      key={p.id}
                      className={cn(
                        "group transition-colors cursor-pointer",
                        active
                          ? "bg-primary/5 hover:bg-primary/10"
                          : "hover:bg-muted/50",
                      )}
                      onClick={() => setSheetProduct(p)}
                    >
                      <TableCell className="overflow-hidden py-3">
                        <span className={cn(
                          "text-sm truncate block",
                          active ? "font-semibold" : "font-medium",
                        )}>
                          {p.nombre}
                        </span>
                      </TableCell>
                      <TableCell className="overflow-hidden py-3 text-right">
                        <span className="text-sm text-muted-foreground tabular-nums">
                          {money(Number(p.precio))}
                        </span>
                      </TableCell>
                      <TableCell className="overflow-hidden py-3 text-center">
                        <span className={cn(
                          "text-sm tabular-nums font-semibold",
                          active ? "text-primary" : "text-muted-foreground/50",
                        )}>
                          {qty || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="overflow-hidden py-3 text-right">
                        <span className={cn(
                          "text-sm tabular-nums",
                          active ? "font-semibold" : "text-muted-foreground/50",
                        )}>
                          {active ? money(rowTotal) : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="overflow-hidden py-3">
                        {active && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCantidad(p.id, 0, Number(p.precio));
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                          >
                            <X className="size-3.5" />
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile rows */}
          <ul className="sm:hidden space-y-1.5">
            {productosFiltrados.map((p) => {
              const qty = getCantidad(p.id);
              const rowTotal = qty * Number(p.precio);
              const active = qty > 0;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setSheetProduct(p)}
                    className={cn(
                      "w-full text-left rounded-xl px-3.5 py-3 transition-all",
                      active
                        ? "glass-panel ring-1 ring-primary/30 bg-primary/5"
                        : "glass-panel",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn(
                        "text-sm truncate",
                        active ? "font-semibold" : "font-medium",
                      )}>
                        {p.nombre}
                      </span>
                      {active && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCantidad(p.id, 0, Number(p.precio));
                          }}
                          className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive shrink-0"
                        >
                          <X className="size-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="tabular-nums">{money(Number(p.precio))}</span>
                      <span>×</span>
                      <span className={cn(
                        "tabular-nums font-semibold",
                        active ? "text-primary" : "",
                      )}>
                        {qty || 0}
                      </span>
                      {active && (
                        <>
                          <span className="ml-auto tabular-nums font-semibold text-foreground">
                            {money(rowTotal)}
                          </span>
                        </>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      ) : selectedUnidad === null ? (
        <div className="text-center py-10 text-sm text-muted-foreground glass-panel rounded-2xl">
          No hay productos en la venta aún.
          <br />
          Selecciona una categoría para agregar productos.
        </div>
      ) : null}

      {/* Total sticky */}
      <div className="sticky bottom-20 md:bottom-4 z-10">
        <Card className="p-4 flex items-center justify-between total-card-gradient border-0 rounded-2xl">
          <Badge variant="secondary" className="bg-primary-foreground/15 text-primary-foreground border-transparent">
            Total ventas
          </Badge>
          <span className="text-xl font-bold tabular-nums">{money(total)}</span>
        </Card>
      </div>

      {/* Bottom sheet para edición de cantidad */}
      <QtySheet
        open={sheetProduct !== null}
        onOpenChange={(open) => {
          if (!open) setSheetProduct(null);
        }}
        producto={sheetProduct}
        qty={sheetQty}
        onChangeQty={(qty) => {
          if (sheetProduct) {
            setCantidad(sheetProduct.id, qty, Number(sheetProduct.precio));
          }
        }}
      />
    </div>
  );
}
