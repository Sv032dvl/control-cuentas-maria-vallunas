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
  CreditCard,
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
  crearCuentaDigitalAction,
  editarCuentaDigitalAction,
  toggleCuentaDigitalActivaAction,
  eliminarCuentaDigitalAction,
} from "../actions";
import type { Tables } from "@/lib/database.types";

type CuentaDigital = Tables<"cuentas_digitales">;

interface Props {
  cuentas: CuentaDigital[];
}

export function CuentasDigitalesTable({ cuentas }: Props) {
  const [search, setSearch] = useState("");
  const filtered = cuentas.filter((c) =>
    c.nombre.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cuenta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <CrearCuentaDialog />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[140px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <CuentaRow key={c.id} cuenta={c} />
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground italic">
                  {search ? "Sin resultados" : "No hay cuentas digitales. Crea la primera."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function CuentaRow({ cuenta }: { cuenta: CuentaDigital }) {
  const [isPending, startTransition] = useTransition();
  const [showEditar, setShowEditar] = useState(false);
  const [showEliminar, setShowEliminar] = useState(false);

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleCuentaDigitalActivaAction(cuenta.id, !cuenta.activo);
      if (result.error) toast.error(result.error);
      else toast.success(result.message);
    });
  }

  function handleEliminar() {
    startTransition(async () => {
      const result = await eliminarCuentaDigitalAction(cuenta.id);
      if (result.error) toast.error(result.error);
      else {
        toast.success(result.message);
        setShowEliminar(false);
      }
    });
  }

  return (
    <>
      <TableRow className={!cuenta.activo ? "opacity-50" : ""}>
        <TableCell className="font-medium">{cuenta.nombre}</TableCell>
        <TableCell>
          {cuenta.es_datafono && (
            <Badge variant="secondary" className="gap-1">
              <CreditCard className="size-3" />
              Datáfono
            </Badge>
          )}
        </TableCell>
        <TableCell>
          <button
            onClick={handleToggle}
            disabled={isPending}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title={cuenta.activo ? "Desactivar" : "Activar"}
          >
            {cuenta.activo ? (
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

      <EditarCuentaDialog
        cuenta={cuenta}
        open={showEditar}
        onOpenChange={setShowEditar}
      />

      <Dialog open={showEliminar} onOpenChange={setShowEliminar}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar cuenta digital</DialogTitle>
            <DialogDescription>
              Se eliminará la cuenta <strong>{cuenta.nombre}</strong> permanentemente.
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

function CrearCuentaDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [esDatafono, setEsDatafono] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      formRef.current?.reset();
      setError(null);
      setEsDatafono(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);
    formData.set("es_datafono", String(esDatafono));
    startTransition(async () => {
      const result = await crearCuentaDigitalAction(formData);
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
            Nueva cuenta
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Crear cuenta digital</DialogTitle>
          <DialogDescription>Agrega una cuenta para recibir pagos digitales.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="cc-nombre">Nombre</Label>
            <Input
              id="cc-nombre"
              name="nombre"
              placeholder="Ej. Nequi María"
              minLength={2}
              maxLength={50}
              required
              disabled={isPending}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={esDatafono}
              onChange={(e) => setEsDatafono(e.target.checked)}
              className="rounded border-border"
              disabled={isPending}
            />
            <span className="text-sm">Es cuenta de datáfono (Loyverse)</span>
          </label>
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
              "Crear cuenta"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditarCuentaDialog({
  cuenta,
  open,
  onOpenChange,
}: {
  cuenta: CuentaDigital;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [esDatafono, setEsDatafono] = useState(cuenta.es_datafono);
  const formRef = useRef<HTMLFormElement>(null);

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (next) {
      setError(null);
      setEsDatafono(cuenta.es_datafono);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);
    formData.set("es_datafono", String(esDatafono));
    startTransition(async () => {
      const result = await editarCuentaDigitalAction(cuenta.id, formData);
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
          <DialogTitle>Editar cuenta digital</DialogTitle>
          <DialogDescription>
            Modificar <strong>{cuenta.nombre}</strong>.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="ec-nombre">Nombre</Label>
            <Input
              id="ec-nombre"
              name="nombre"
              defaultValue={cuenta.nombre}
              minLength={2}
              maxLength={50}
              required
              disabled={isPending}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={esDatafono}
              onChange={(e) => setEsDatafono(e.target.checked)}
              className="rounded border-border"
              disabled={isPending}
            />
            <span className="text-sm">Es cuenta de datáfono (Loyverse)</span>
          </label>
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
