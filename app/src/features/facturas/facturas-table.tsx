"use client";

import { useState, useMemo, useTransition } from "react";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  CheckCircle2,
  Loader2,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { money } from "@/lib/format";
import { dateShort } from "@/lib/format";
import { FacturaForm } from "./factura-form";
import { eliminarFactura, marcarPagada } from "./actions";
import type { Factura, FacturaEstado } from "./schema";

type Props = {
  facturas: Factura[];
};

const ESTADO_BADGE: Record<FacturaEstado, { label: string; className: string }> = {
  pendiente: {
    label: "Pendiente",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  },
  pagada: {
    label: "Pagada",
    className: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",
  },
  vencida: {
    label: "Vencida",
    className: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400",
  },
};

export function FacturasTable({ facturas }: Props) {
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Factura | undefined>();
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return facturas.filter((f) => {
      const matchSearch =
        f.proveedor.toLowerCase().includes(search.toLowerCase()) ||
        (f.numero_factura?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchEstado =
        filterEstado === "todos" || f.estado === filterEstado;
      return matchSearch && matchEstado;
    });
  }, [facturas, search, filterEstado]);

  const totalPendiente = useMemo(
    () =>
      facturas
        .filter((f) => f.estado === "pendiente")
        .reduce((acc, f) => acc + f.monto, 0),
    [facturas],
  );

  function openCreate() {
    setEditing(undefined);
    setDialogOpen(true);
  }

  function openEdit(f: Factura) {
    setEditing(f);
    setDialogOpen(true);
  }

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta factura?")) return;
    startTransition(async () => {
      const res = await eliminarFactura(id);
      if (!res.ok) toast.error(res.error);
      else toast.success("Factura eliminada");
    });
  }

  function handlePagar(id: string, metodo: "efectivo" | "transferencia") {
    startTransition(async () => {
      const res = await marcarPagada(id, metodo);
      if (!res.ok) toast.error(res.error);
      else toast.success("Factura marcada como pagada");
    });
  }

  return (
    <div className="space-y-4">
      {/* Resumen rápido */}
      {totalPendiente > 0 && (
        <Card className="p-3 flex items-center justify-between border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
          <span className="text-sm text-amber-700 dark:text-amber-400">
            Total pendiente de pago
          </span>
          <span className="text-lg font-bold tabular-nums text-amber-700 dark:text-amber-400">
            {money(totalPendiente)}
          </span>
        </Card>
      )}

      {/* Barra de filtros */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar proveedor o # factura..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterEstado} onValueChange={(v) => setFilterEstado(v ?? "todos")}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="pagada">Pagada</SelectItem>
            <SelectItem value="vencida">Vencida</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={openCreate} className="h-10">
          <Plus className="size-4" /> Nueva
        </Button>
      </div>

      {/* Lista de facturas */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">
          {facturas.length === 0
            ? "No hay facturas registradas."
            : "No se encontraron facturas con esos filtros."}
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((f) => {
            const badge = ESTADO_BADGE[f.estado];
            return (
              <li key={f.id}>
                <Card className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{f.proveedor}</p>
                        <Badge
                          variant="secondary"
                          className={cn("text-[10px] px-1.5 py-0", badge.className)}
                        >
                          {badge.label}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        {f.numero_factura && <span># {f.numero_factura}</span>}
                        <span>{dateShort(f.fecha)}</span>
                        {f.fecha_vencimiento && (
                          <span>Vence: {dateShort(f.fecha_vencimiento)}</span>
                        )}
                        {f.fecha_pago && (
                          <span className="text-green-600 dark:text-green-400">
                            Pagada: {dateShort(f.fecha_pago)}
                          </span>
                        )}
                      </div>
                      {f.nota && (
                        <p className="text-xs text-muted-foreground italic truncate">
                          {f.nota}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold tabular-nums">
                        {money(f.monto)}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="inline-flex items-center justify-center size-8 shrink-0 rounded-md hover:bg-accent hover:text-accent-foreground"
                        disabled={isPending}
                      >
                        {isPending ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <MoreHorizontal className="size-4" />
                        )}
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(f)}>
                          <Pencil className="size-4" /> Editar
                        </DropdownMenuItem>
                        {f.estado === "pendiente" && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handlePagar(f.id, "efectivo")}
                            >
                              <CheckCircle2 className="size-4" /> Pagar (efectivo)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handlePagar(f.id, "transferencia")}
                            >
                              <CheckCircle2 className="size-4" /> Pagar (transferencia)
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDelete(f.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="size-4" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {/* Dialog crear/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar factura" : "Nueva factura"}
            </DialogTitle>
          </DialogHeader>
          <FacturaForm
            factura={editing}
            onSuccess={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
