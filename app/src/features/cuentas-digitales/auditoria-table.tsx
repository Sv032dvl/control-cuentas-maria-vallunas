"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { money, dateShort } from "@/lib/format";
import { PROPIETARIOS, nombrePropietario } from "@/lib/negocio";
import { cn } from "@/lib/utils";
import type { AuditoriaDigital } from "./loaders";

export function AuditoriaTable({ datos }: { datos: AuditoriaDigital }) {
  const [cuentaFiltro, setCuentaFiltro] = useState<string | null>(null);

  const movimientos = useMemo(
    () =>
      cuentaFiltro
        ? datos.movimientos.filter((m) => m.cuenta_id === cuentaFiltro)
        : datos.movimientos,
    [datos.movimientos, cuentaFiltro],
  );

  // Agrupar por fecha para el detalle día por día
  const porDia = useMemo(() => {
    const m = new Map<string, typeof movimientos>();
    for (const mov of movimientos) {
      const lista = m.get(mov.fecha) ?? [];
      lista.push(mov);
      m.set(mov.fecha, lista);
    }
    return Array.from(m.entries());
  }, [movimientos]);

  const totalGeneral = datos.movimientos.reduce((a, m) => a + m.monto, 0);

  return (
    <div className="space-y-6">
      {/* Total por dueño */}
      <section className="grid sm:grid-cols-3 gap-3">
        {PROPIETARIOS.map((p) => (
          <Card key={p.id} className="p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span>{p.emoji}</span> {p.nombre}
            </p>
            <p className="text-2xl font-bold tabular-nums mt-1">
              {money(datos.totalPorDueno[p.id])}
            </p>
          </Card>
        ))}
        <Card className={cn("p-4", datos.totalPorDueno.sinDueno > 0 && "border-amber-300")}>
          <p className="text-xs text-muted-foreground">Sin dueño asignado</p>
          <p
            className={cn(
              "text-2xl font-bold tabular-nums mt-1",
              datos.totalPorDueno.sinDueno > 0 && "text-amber-600 dark:text-amber-400",
            )}
          >
            {money(datos.totalPorDueno.sinDueno)}
          </p>
          {datos.totalPorDueno.sinDueno > 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              Asigna un dueño a esas cuentas en Catálogos
            </p>
          )}
        </Card>
      </section>

      {/* Resumen por cuenta — también funciona como filtro */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Por cuenta</h2>
        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cuenta</TableHead>
                <TableHead>Dueño</TableHead>
                <TableHead className="text-right">Movimientos</TableHead>
                <TableHead className="text-right">Total recibido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {datos.resumen.map((c) => (
                <TableRow
                  key={c.cuenta_id}
                  onClick={() =>
                    setCuentaFiltro(cuentaFiltro === c.cuenta_id ? null : c.cuenta_id)
                  }
                  className={cn(
                    "cursor-pointer",
                    !c.activo && "opacity-50",
                    cuentaFiltro === c.cuenta_id && "bg-primary/5",
                  )}
                >
                  <TableCell className="font-medium">
                    {c.cuenta_nombre}
                    {!c.activo && (
                      <span className="ml-2 text-xs text-muted-foreground italic">
                        inactiva
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {c.propietario ? (
                      <Badge variant="secondary">{nombrePropietario(c.propietario)}</Badge>
                    ) : (
                      <span className="text-xs text-amber-600 dark:text-amber-400">
                        Sin asignar
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {c.movimientos}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {money(c.total)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/40 font-semibold">
                <TableCell colSpan={3}>Total</TableCell>
                <TableCell className="text-right tabular-nums">
                  {money(totalGeneral)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground">
          Toca una cuenta para ver solo sus movimientos.
        </p>
      </section>

      {/* Detalle día por día */}
      <section className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Detalle día por día</h2>
          {cuentaFiltro && (
            <button
              onClick={() => setCuentaFiltro(null)}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Quitar filtro
            </button>
          )}
        </div>

        {porDia.length === 0 ? (
          <p className="text-sm text-muted-foreground italic py-8 text-center">
            Sin movimientos en el periodo.
          </p>
        ) : (
          <div className="space-y-3">
            {porDia.map(([fecha, movs]) => {
              const totalDia = movs.reduce((a, m) => a + m.monto, 0);
              return (
                <Card key={fecha} className="p-4 space-y-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <Link
                      href={`/dashboard/cierres/${movs[0].cierre_id}`}
                      className="font-medium capitalize hover:underline"
                    >
                      {dateShort(fecha)}
                    </Link>
                    <span className="tabular-nums font-semibold">{money(totalDia)}</span>
                  </div>
                  <ul className="space-y-1 text-sm">
                    {movs.map((m, i) => (
                      <li key={i} className="flex justify-between gap-3">
                        <span className="text-muted-foreground truncate">
                          {m.cuenta_nombre}
                          {m.descripcion && (
                            <span className="italic"> · {m.descripcion}</span>
                          )}
                        </span>
                        <span className="tabular-nums shrink-0">{money(m.monto)}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
