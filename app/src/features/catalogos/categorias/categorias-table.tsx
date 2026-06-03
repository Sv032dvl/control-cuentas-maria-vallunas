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
import {
  crearCategoriaAction,
  editarCategoriaAction,
  toggleCategoriaActivaAction,
  eliminarCategoriaAction,
} from "../actions";
import type { Tables } from "@/lib/database.types";

type Categoria = Tables<"categorias_egreso">;

interface Props {
  categorias: Categoria[];
}

export function CategoriasTable({ categorias }: Props) {
  const [search, setSearch] = useState("");
  const filtered = categorias.filter((c) =>
    c.nombre.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar categoría..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <CrearCategoriaDialog />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[140px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <CategoriaRow key={c.id} categoria={c} />
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground italic">
                  {search ? "Sin resultados" : "No hay categorías. Crea la primera."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function CategoriaRow({ categoria }: { categoria: Categoria }) {
  const [isPending, startTransition] = useTransition();
  const [showEditar, setShowEditar] = useState(false);
  const [showEliminar, setShowEliminar] = useState(false);

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleCategoriaActivaAction(categoria.id, !categoria.activo);
      if (result.error) toast.error(result.error);
      else toast.success(result.message);
    });
  }

  function handleEliminar() {
    startTransition(async () => {
      const result = await eliminarCategoriaAction(categoria.id);
      if (result.error) toast.error(result.error);
      else {
        toast.success(result.message);
        setShowEliminar(false);
      }
    });
  }

  return (
    <>
      <TableRow className={!categoria.activo ? "opacity-50" : ""}>
        <TableCell className="font-medium">{categoria.nombre}</TableCell>
        <TableCell>
          <button
            onClick={handleToggle}
            disabled={isPending}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title={categoria.activo ? "Desactivar" : "Activar"}
          >
            {categoria.activo ? (
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

      <EditarCategoriaDialog
        categoria={categoria}
        open={showEditar}
        onOpenChange={setShowEditar}
      />

      <Dialog open={showEliminar} onOpenChange={setShowEliminar}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar categoría</DialogTitle>
            <DialogDescription>
              Se eliminará <strong>{categoria.nombre}</strong> permanentemente.
              Si tiene egresos asociados, no se podrá eliminar.
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

function CrearCategoriaDialog() {
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
      const result = await crearCategoriaAction(formData);
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
            Nueva categoría
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Crear categoría de egreso</DialogTitle>
          <DialogDescription>Agrega una nueva categoría para clasificar egresos.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="cc-nombre">Nombre</Label>
            <Input
              id="cc-nombre"
              name="nombre"
              placeholder="Ej. Insumos"
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
              "Crear categoría"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditarCategoriaDialog({
  categoria,
  open,
  onOpenChange,
}: {
  categoria: Categoria;
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
      const result = await editarCategoriaAction(categoria.id, formData);
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
          <DialogTitle>Editar categoría</DialogTitle>
          <DialogDescription>
            Modificar <strong>{categoria.nombre}</strong>.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="ec-nombre">Nombre</Label>
            <Input
              id="ec-nombre"
              name="nombre"
              defaultValue={categoria.nombre}
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
