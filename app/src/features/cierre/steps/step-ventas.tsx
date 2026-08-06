"use client";

import { useMemo, useState, useTransition } from "react";
import { useFormContext } from "react-hook-form";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import {
  ShoppingBag,
  Zap,
  RefreshCw,
  Download,
  Loader2,
  ArrowUpDown,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProductTile } from "../components/product-tile";
import { QtySheet } from "../components/qty-sheet";
import { money } from "@/lib/format";
import { importarVentasLoyverse, reorderProductosAction } from "../actions";
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

export function StepVentas({ productos: productosProp, unidades, loyverseData, fecha }: Props) {
  const { watch, setValue } = useFormContext<CierreFormValues>();
  const ventas = watch("ventas");
  const [imported, setImported] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selectedUnidad, setSelectedUnidad] = useState<string | null>(null);
  const [sheetProduct, setSheetProduct] = useState<CatalogProducto | null>(null);
  const [reorderMode, setReorderMode] = useState(false);
  const [localProductos, setLocalProductos] = useState(productosProp);
  const [isSaving, startSaving] = useTransition();

  const productos = localProductos;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

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

  // Productos filtrados: "Venta" muestra solo con qty > 0, categoría filtra por unidad
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

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const filtered = productosFiltrados;
    const oldIndex = filtered.findIndex((p) => p.id === active.id);
    const newIndex = filtered.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // Reordenar el array filtrado
    const reordered = arrayMove(filtered, oldIndex, newIndex);

    // Actualizar el array completo de productos manteniendo el orden de los no filtrados
    const filteredIds = new Set(filtered.map((p) => p.id));
    const updatedAll = [...localProductos];
    const filteredPositions = updatedAll
      .map((p, i) => (filteredIds.has(p.id) ? i : -1))
      .filter((i) => i !== -1);

    for (let i = 0; i < reordered.length; i++) {
      updatedAll[filteredPositions[i]] = { ...reordered[i], orden: filteredPositions[i] };
    }

    setLocalProductos(updatedAll);

    // Guardar en BD
    const orden = updatedAll.map((p, i) => ({ id: p.id, orden: i }));
    startSaving(async () => {
      const result = await reorderProductosAction(orden);
      if (result.ok) {
        toast.success("Orden guardado");
      } else {
        toast.error("Error al guardar el orden");
      }
    });
  }

  function toggleReorderMode() {
    if (reorderMode) {
      setReorderMode(false);
    } else {
      // Activar reordenar solo en una categoría específica
      if (!selectedUnidad) {
        // Si está en "Venta", cambiar a la primera categoría
        if (grupos.length > 0) {
          setSelectedUnidad(grupos[0][0]);
        }
      }
      setReorderMode(true);
    }
  }

  const sheetQty = sheetProduct ? getCantidad(sheetProduct.id) : 0;
  const sortableIds = productosFiltrados.map((p) => p.id);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2.5 tracking-tight">
            <span className="flex items-center justify-center size-9 rounded-xl btn-gradient shadow-sm">
              <ShoppingBag className="size-4 text-primary-foreground" />
            </span>
            Ventas del día
          </h2>
          <Button
            type="button"
            variant={reorderMode ? "default" : "ghost"}
            size="sm"
            onClick={toggleReorderMode}
            disabled={isSaving}
            className="h-8"
          >
            {reorderMode ? (
              <>
                <Check className="size-3.5" />
                <span className="text-xs">Listo</span>
              </>
            ) : (
              <>
                <ArrowUpDown className="size-3.5" />
                <span className="text-xs">Ordenar</span>
              </>
            )}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {reorderMode
            ? "Arrastra los productos para cambiar su orden."
            : "Selecciona una categoría y toca el producto para registrar la cantidad."}
        </p>
      </div>

      {/* Botón importar o banner con actualizar */}
      {!reorderMode && (
        <>
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
        </>
      )}

      {/* Pills de categoría */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
        {!reorderMode && (
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
        )}
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

      {/* Grid de productos */}
      {productosFiltrados.length > 0 ? (
        reorderMode ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {productosFiltrados.map((p) => (
                  <ProductTile
                    key={p.id}
                    producto={p}
                    qty={getCantidad(p.id)}
                    onPress={() => {}}
                    sortable
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {productosFiltrados.map((p) => (
              <ProductTile
                key={p.id}
                producto={p}
                qty={getCantidad(p.id)}
                onPress={() => setSheetProduct(p)}
              />
            ))}
          </div>
        )
      ) : selectedUnidad === null ? (
        <div className="text-center py-10 text-sm text-muted-foreground glass-panel rounded-2xl">
          No hay productos en la venta aún.
          <br />
          Selecciona una categoría para agregar productos.
        </div>
      ) : null}

      {/* Total sticky */}
      {!reorderMode && (
        <div className="sticky bottom-20 md:bottom-4 z-10">
          <Card className="p-4 flex items-center justify-between total-card-gradient border-0 rounded-2xl">
            <Badge variant="secondary" className="bg-primary-foreground/15 text-primary-foreground border-transparent">
              Total ventas
            </Badge>
            <span className="text-xl font-bold tabular-nums">{money(total)}</span>
          </Card>
        </div>
      )}

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
