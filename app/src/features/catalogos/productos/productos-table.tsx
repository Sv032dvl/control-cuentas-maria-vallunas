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
  crearProductoAction,
  editarProductoAction,
  toggleProductoActivoAction,
  eliminarProductoAction,
} from "../actions";
import type { Tables } from "@/lib/database.types";

type Producto = Tables<"productos">;
type Unidad = Tables<"unidades_negocio">;

const UNIDAD_COLORS: Record<string, string> = {
  Empanadas: "bg-amber-100 text-amber-800",
  "Pizzería": "bg-red-100 text-red-800",
  Bebidas: "bg-blue-100 text-blue-800",
  Compartido: "bg-purple-100 text-purple-800",
};

interface Props {
  productos: (Producto & { unidades_negocio: { nombre: string } | null })[];
  unidades: Unidad[];
}

export function ProductosTable({ productos, unidades }: Props) {
  const [search, setSearch] = useState("");
  const filtered = productos.filter((p) =>
    p.nombre.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <CrearProductoDialog unidades={unidades} />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[140px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <ProductoRow key={p.id} producto={p} unidades={unidades} />
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground italic">
                  {search ? "Sin resultados" : "No hay productos. Crea el primero."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ─── Row ─────────────────────────────────────────────────────────────────────

function ProductoRow({
  producto,
  unidades,
}: {
  producto: Producto & { unidades_negocio: { nombre: string } | null };
  unidades: Unidad[];
}) {
  const [isPending, startTransition] = useTransition();
  const [showEditar, setShowEditar] = useState(false);
  const [showEliminar, setShowEliminar] = useState(false);

  const unidadNombre = producto.unidades_negocio?.nombre ?? "—";
  const colorClass = UNIDAD_COLORS[unidadNombre] ?? "bg-gray-100 text-gray-800";

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleProductoActivoAction(producto.id, !producto.activo);
      if (result.error) toast.error(result.error);
      else toast.success(result.message);
    });
  }

  function handleEliminar() {
    startTransition(async () => {
      const result = await eliminarProductoAction(producto.id);
      if (result.error) toast.error(result.error);
      else {
        toast.success(result.message);
        setShowEliminar(false);
      }
    });
  }

  return (
    <>
      <TableRow className={!producto.activo ? "opacity-50" : ""}>
        <TableCell className="font-medium">{producto.nombre}</TableCell>
        <TableCell>{money(producto.precio)}</TableCell>
        <TableCell>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>
            {unidadNombre}
          </span>
        </TableCell>
        <TableCell>
          <button
            onClick={handleToggle}
            disabled={isPending}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title={producto.activo ? "Desactivar" : "Activar"}
          >
            {producto.activo ? (
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

      {/* Edit dialog */}
      <EditarProductoDialog
        producto={producto}
        unidades={unidades}
        open={showEditar}
        onOpenChange={setShowEditar}
      />

      {/* Delete confirmation dialog */}
      <Dialog open={showEliminar} onOpenChange={setShowEliminar}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar producto</DialogTitle>
            <DialogDescription>
              Se eliminará <strong>{producto.nombre}</strong> permanentemente.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setShowEliminar(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleEliminar}
              disabled={isPending}
            >
              {isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Create dialog ───────────────────────────────────────────────────────────

function CrearProductoDialog({ unidades }: { unidades: Unidad[] }) {
  const [open, setOpen] = useState(false);
  const [unidadId, setUnidadId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      formRef.current?.reset();
      setUnidadId(unidades[0]?.id ?? "");
      setError(null);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);
    formData.set("unidad_id", unidadId);

    startTransition(async () => {
      const result = await crearProductoAction(formData);
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
            Nuevo producto
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear producto</DialogTitle>
          <DialogDescription>Agrega un nuevo producto al catálogo.</DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="cp-nombre">Nombre</Label>
            <Input
              id="cp-nombre"
              name="nombre"
              placeholder="Ej. Empanada de carne"
              required
              minLength={2}
              maxLength={80}
              disabled={isPending}
              autoComplete="off"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cp-precio">Precio</Label>
            <Input
              id="cp-precio"
              name="precio"
              type="number"
              inputMode="numeric"
              placeholder="0"
              min={0}
              step="any"
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Unidad de negocio</Label>
            <input type="hidden" name="unidad_id" value={unidadId} />
            <div className="grid grid-cols-2 gap-2">
              {unidades.filter((u) => u.activo).map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setUnidadId(u.id)}
                  disabled={isPending}
                  className={[
                    "rounded-lg border-2 px-3 py-2 text-sm font-medium text-left transition-colors",
                    unidadId === u.id
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50",
                  ].join(" ")}
                >
                  {u.nombre}
                </button>
              ))}
            </div>
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
              "Crear producto"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit dialog ─────────────────────────────────────────────────────────────

function EditarProductoDialog({
  producto,
  unidades,
  open,
  onOpenChange,
}: {
  producto: Producto;
  unidades: Unidad[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [unidadId, setUnidadId] = useState(producto.unidad_id);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (next) {
      setUnidadId(producto.unidad_id);
      setError(null);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);
    formData.set("unidad_id", unidadId);

    startTransition(async () => {
      const result = await editarProductoAction(producto.id, formData);
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar producto</DialogTitle>
          <DialogDescription>Modificar datos de <strong>{producto.nombre}</strong>.</DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="ep-nombre">Nombre</Label>
            <Input
              id="ep-nombre"
              name="nombre"
              defaultValue={producto.nombre}
              required
              minLength={2}
              maxLength={80}
              disabled={isPending}
              autoComplete="off"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ep-precio">Precio</Label>
            <Input
              id="ep-precio"
              name="precio"
              type="number"
              inputMode="numeric"
              defaultValue={producto.precio}
              min={0}
              step="any"
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Unidad de negocio</Label>
            <input type="hidden" name="unidad_id" value={unidadId} />
            <div className="grid grid-cols-2 gap-2">
              {unidades.filter((u) => u.activo).map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setUnidadId(u.id)}
                  disabled={isPending}
                  className={[
                    "rounded-lg border-2 px-3 py-2 text-sm font-medium text-left transition-colors",
                    unidadId === u.id
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50",
                  ].join(" ")}
                >
                  {u.nombre}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
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
