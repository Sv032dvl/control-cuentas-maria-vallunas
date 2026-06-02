"use client";

import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { ShoppingBag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QtyStepper } from "../components/qty-stepper";
import { money } from "@/lib/format";
import type {
  CatalogProducto,
  CatalogUnidad,
} from "../loaders";
import type { CierreFormValues } from "../schema";

type Props = {
  productos: CatalogProducto[];
  unidades: CatalogUnidad[];
};

export function StepVentas({ productos, unidades }: Props) {
  const { watch, setValue } = useFormContext<CierreFormValues>();
  const ventas = watch("ventas");

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

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <ShoppingBag className="size-5 text-primary" /> Ventas del día
        </h2>
        <p className="text-sm text-muted-foreground">
          Anota la cantidad vendida por producto. El total se calcula solo.
        </p>
      </div>

      <div className="space-y-4">
        {grupos.map(([unidadId, lista]) => (
          <section key={unidadId} className="space-y-2">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              {unidadById[unidadId] ?? "—"}
            </h3>
            <ul className="space-y-2">
              {lista.map((p) => {
                const qty = getCantidad(p.id);
                const sub = qty * Number(p.precio);
                return (
                  <li key={p.id}>
                    <Card className="p-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium leading-tight truncate">
                          {p.nombre}
                        </p>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {money(Number(p.precio))}
                          {qty > 0 && (
                            <>
                              {" · "}
                              <span className="text-primary font-medium">
                                {money(sub)}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                      <QtyStepper
                        value={qty}
                        onChange={(n) => setCantidad(p.id, n, Number(p.precio))}
                      />
                    </Card>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <div className="sticky bottom-20 md:bottom-4 z-10">
        <Card className="p-3 flex items-center justify-between bg-primary text-primary-foreground border-primary">
          <Badge variant="secondary" className="bg-primary-foreground/15 text-primary-foreground border-transparent">
            Total ventas
          </Badge>
          <span className="text-xl font-bold tabular-nums">{money(total)}</span>
        </Card>
      </div>
    </div>
  );
}
