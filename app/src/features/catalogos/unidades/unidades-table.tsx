"use client";

import { useState, useTransition, useRef } from "react";
import {
  Plus,
  Search,
  Loader2,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  crearUnidadAction,
  editarUnidadAction,
  toggleUnidadActivaAction,
  toggleUnidadAceptaGastosAction,
  toggleUnidadRecaudoTercerosAction,
  asignarPropietarioUnidadAction,
  eliminarUnidadAction,
} from "../actions";
import type { Tables } from "@/lib/database.types";

type Unidad = Tables<"unidades_negocio">;

interface Props {
  unidades: Unidad[];
}

export function UnidadesTable({ unidades }: Props) {
  const [search, setSearch] = useState("");
  const filtered = unidades.filter((u) =>
    u.nombre.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar unidad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <CrearUnidadDialog />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Dueño</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Recibe gastos</TableHead>
              <TableHead>No es venta</TableHead>
              <TableHead className="w-[140px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((u) => (
              <UnidadRow key={u.id} unidad={u} />
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground italic">
                  {search ? "Sin resultados" : "No hay unidades. Crea la primera."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function UnidadRow({ unidad }: { unidad: Unidad }) {
  const [isPending, startTransition] = useTransition();
  const [showEditar, setShowEditar] = useState(false);
  const [showEliminar, setShowEliminar] = useState(false);
  const isCompartido = unidad.nombre.toLowerCase() === "compartido";

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleUnidadActivaAction(unidad.id, !unidad.activo);
      if (result.error) toast.error(result.error);
      else toast.success(result.message);
    });
  }

  function handleToggleGastos() {
    startTransition(async () => {
      const result = await toggleUnidadAceptaGastosAction(
        unidad.id,
        !unidad.acepta_gastos,
      );
      if (result.error) toast.error(result.error);
      else toast.success(result.message);
    });
  }

  function handlePropietario(valor: number | null) {
    startTransition(async () => {
      const result = await asignarPropietarioUnidadAction(unidad.id, valor);
      if (result.error) toast.error(result.error);
      else toast.success(result.message);
    });
  }

  function handleToggleRecaudo() {
    startTransition(async () => {
      const result = await toggleUnidadRecaudoTercerosAction(
        unidad.id,
        !unidad.es_recaudo_terceros,
      );
      if (result.error) toast.error(result.error);
      else toast.success(result.message);
    });
  }

  function handleEliminar() {
    startTransition(async () => {
      const result = await eliminarUnidadAction(unidad.id, unidad.nombre);
      if (result.error) toast.error(result.error);
      else {
        toast.success(result.message);
        setShowEliminar(false);
      }
    });
  }

  return (
    <>
      <TableRow className={!unidad.activo ? "opacity-50" : ""}>
        <TableCell className="font-medium">
          <span className="flex items-center gap-2">
            {unidad.nombre}
            {isCompartido && (
              <Badge variant="outline" className="text-xs">
                <ShieldAlert className="size-3 mr-1" />
                Protegida
              </Badge>
            )}
          </span>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            {[
              { v: 1 as const, label: "🥟" },
              { v: 2 as const, label: "🍕" },
              { v: null, label: "—" },
            ].map((o) => (
              <button
                key={o.v ?? "ninguno"}
                onClick={() => handlePropietario(o.v)}
                disabled={isPending}
                title={
                  o.v === 1 ? "Empanadas" : o.v === 2 ? "Pizzería" : "Sin dueño"
                }
                className={[
                  "rounded-md px-1.5 py-0.5 text-sm transition-colors",
                  unidad.propietario === o.v
                    ? "bg-primary/10 ring-1 ring-primary/40"
                    : "opacity-40 hover:opacity-80",
                ].join(" ")}
              >
                {o.label}
              </button>
            ))}
          </div>
        </TableCell>
        <TableCell>
          <button
            onClick={handleToggle}
            disabled={isPending}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title={unidad.activo ? "Desactivar" : "Activar"}
          >
            {unidad.activo ? (
              <ToggleRight className="size-5 text-green-600" />
            ) : (
              <ToggleLeft className="size-5" />
            )}
          </button>
        </TableCell>
        <TableCell>
          <button
            onClick={handleToggleGastos}
            disabled={isPending}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title={
              unidad.acepta_gastos
                ? "Quitar del selector de Gastos"
                : "Mostrar en el selector de Gastos"
            }
          >
            {unidad.acepta_gastos ? (
              <ToggleRight className="size-5 text-green-600" />
            ) : (
              <ToggleLeft className="size-5" />
            )}
          </button>
        </TableCell>
        <TableCell>
          <button
            onClick={handleToggleRecaudo}
            disabled={isPending}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title={
              unidad.es_recaudo_terceros
                ? "Se cobra pero no es ingreso del negocio (ej. domicilios)"
                : "Cuenta como venta del negocio"
            }
          >
            {unidad.es_recaudo_terceros ? (
              <ToggleRight className="size-5 text-amber-600" />
            ) : (
              <ToggleLeft className="size-5" />
            )}
          </button>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setShowEditar(true)}
              disabled={isPending}
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setShowEliminar(true)}
              disabled={isPending || isCompartido}
              className="text-destructive hover:text-destructive"
              title={isCompartido ? "No se puede eliminar 'Compartido'" : "Eliminar"}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      <EditarUnidadDialog
        unidad={unidad}
        open={showEditar}
        onOpenChange={setShowEditar}
      />

      <Dialog open={showEliminar} onOpenChange={setShowEliminar}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar unidad</DialogTitle>
            <DialogDescription>
              Se eliminará <strong>{unidad.nombre}</strong> permanentemente.
              Si tiene productos asociados, no se podrá eliminar.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setShowEliminar(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleEliminar} disabled={isPending}>
              {isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CrearUnidadDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      formRef.current?.reset();
      setError(null);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);
    startTransition(async () => {
      const result = await crearUnidadAction(formData);
      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        formRef.current?.reset();
      } else {
        setError(result.error ?? "Error desconocido");
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button size="sm">
            <Plus className="size-4 mr-1.5" />
            Nueva unidad
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Crear unidad de negocio</DialogTitle>
          <DialogDescription>Agrega una nueva unidad para organizar productos y gastos.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="cu-nombre">Nombre</Label>
            <Input
              id="cu-nombre"
              name="nombre"
              placeholder="Ej. Postres"
              required
              minLength={2}
              maxLength={50}
              disabled={isPending}
              autoComplete="off"
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              "Crear unidad"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditarUnidadDialog({
  unidad,
  open,
  onOpenChange,
}: {
  unidad: Unidad;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (next) setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);
    startTransition(async () => {
      const result = await editarUnidadAction(unidad.id, formData);
      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
      } else {
        setError(result.error ?? "Error desconocido");
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Editar unidad</DialogTitle>
          <DialogDescription>
            Modificar <strong>{unidad.nombre}</strong>.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="eu-nombre">Nombre</Label>
            <Input
              id="eu-nombre"
              name="nombre"
              defaultValue={unidad.nombre}
              required
              minLength={2}
              maxLength={50}
              disabled={isPending}
              autoComplete="off"
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
