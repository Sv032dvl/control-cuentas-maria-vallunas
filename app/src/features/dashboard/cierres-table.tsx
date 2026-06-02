import Link from "next/link";
import { CheckCircle2, AlertTriangle, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { money, moneyDecimal, dateShort } from "@/lib/format";
import type { CuadreRow } from "./loaders";
import { cn } from "@/lib/utils";

export function CierresTable({ rows }: { rows: CuadreRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic py-8 text-center">
        Aún no hay cierres registrados.
      </p>
    );
  }

  return (
    <>
      {/* Mobile: cards */}
      <ul className="md:hidden space-y-2">
        {rows.map((r) => (
          <li key={r.id}>
            <Link
              href={`/dashboard/cierres/${r.id}`}
              className="block rounded-lg border bg-card p-3 active:bg-accent"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-sm">{dateShort(r.fecha)}</p>
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
          </li>
        ))}
      </ul>

      {/* Desktop: table */}
      <div className="hidden md:block rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
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
            {rows.map((r) => (
              <TableRow key={r.id} className="hover:bg-accent/40">
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
                    <Badge variant="secondary" className="bg-success/15 text-success border-success/30">
                      Cuadrado
                    </Badge>
                  ) : (
                    <Badge variant="destructive">Descuadrado</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/dashboard/cierres/${r.id}`}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Ver detalle"
                  >
                    <ChevronRight className="size-4" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
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
