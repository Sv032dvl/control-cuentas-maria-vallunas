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
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { money } from "@/lib/format";
import {
  crearDenominacionAction,
  editarDenominacionAction,
  toggleDenominacionActivaAction,
  eliminarDenominacionAction,
} from "../actions";
import type { Tables } from "@/lib/database.types";

type Denominacion = Tables<"denominaciones_billete">;

interface Props {
  denominaciones: Denominacion[];
}

export function DenominacionesTable({ denominaciones }: Props) {
  const [search, setSearch] = useState("");
  const filtered = denominaciones.filter((d) =>
    d.valor.toString().includes(search),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar valor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
            inputMode="numeric"
          />
        </div>
        <CrearDenominacionDialog />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Valor</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[140px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((d) => (
              <DenominacionRow key={d.id} denominacion={d} />
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground italic">
                  {search ? "Sin resultados" : "No hay denominaciones. Crea la primera."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function DenominacionRow({ denominacion }: { denominacion: Denominacion }) {
  const [isPending, startTransition] = useTransition();
  const [showEditar, setShowEditar] = useState(false);
  const [showEliminar, setShowEliminar] = useState(false);

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleDenominacionActivaAction(denominacion.id, !denominacion.activo);
      if (result.error) toast.error(result.error);
      else toast.success(result.message);
    });
  }

  function handleEliminar() {
    startTransition(async () => {
      const result = await eliminarDenominacionAction(denominacion.id);
      if (result.error) toast.error(result.error);
      else {
        toast.success(result.message);
        setShowEliminar(false);
      }
    });
  }

  return (
    <>
      <TableRow className={!denominacion.activo ? "opacity-50" : ""}>
        <TableCell className="font-medium font-mono">
          {money(denominacion.valor)}
        </TableCell>
        <TableCell>
          <button
            onClick={handleToggle}
            disabled={isPending}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title={denominacion.activo ? "Desactivar" : "Activar"}
          >
            {denominacion.activo ? (
              <ToggleRight className="size-5 text-green-600" />
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
              disabled={isPending}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      <EditarDenominacionDialog
        denominacion={denominacion}
        open={showEditar}
        onOpenChange={setShowEditar}
      />

      <Dialog open={showEliminar} onOpenChange={setShowEliminar}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar denominación</DialogTitle>
            <DialogDescription>
              Se eliminará la denominación <strong>{money(denominacion.valor)}</strong> permanentemente.
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

function CrearDenominacionDialog() {
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
      const result = await crearDenominacionAction(formData);
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
            Nueva denominación
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Crear denominación</DialogTitle>
          <DialogDescription>Agrega un nuevo valor de billete para el arqueo.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="cd-valor">Valor ($)</Label>
            <Input
              id="cd-valor"
              name="valor"
              type="number"
              inputMode="numeric"
              placeholder="Ej. 10000"
              min={1}
              required
              disabled={isPending}
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
              "Crear denominación"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditarDenominacionDialog({
  denominacion,
  open,
  onOpenChange,
}: {
  denominacion: Denominacion;
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
      const result = await editarDenominacionAction(denominacion.id, formData);
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
          <DialogTitle>Editar denominación</DialogTitle>
          <DialogDescription>
            Modificar el valor de <strong>{money(denominacion.valor)}</strong>.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="ed-valor">Valor ($)</Label>
            <Input
              id="ed-valor"
              name="valor"
              type="number"
              inputMode="numeric"
              defaultValue={denominacion.valor}
              min={1}
              required
              disabled={isPending}
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
