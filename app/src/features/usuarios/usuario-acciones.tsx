"use client";

import { useState, useTransition } from "react";
import {
  MoreHorizontal,
  KeyRound,
  UserCheck,
  UserX,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  toggleActivoAction,
  cambiarPasswordAction,
  eliminarUsuarioAction,
  editarUsuarioAction,
} from "./actions";

interface Props {
  userId: string;
  activo: boolean;
  nombre: string;
  role: "empleado" | "admin";
}

export function UsuarioAcciones({ userId, activo, nombre, role }: Props) {
  const [isPending, startTransition] = useTransition();

  // Dialog states
  const [showPassword, setShowPassword] = useState(false);
  const [showEditar, setShowEditar] = useState(false);
  const [showEliminar, setShowEliminar] = useState(false);

  // Form states
  const [newPassword, setNewPassword] = useState("");
  const [editNombre, setEditNombre] = useState(nombre);
  const [editRole, setEditRole] = useState<"empleado" | "admin">(role);

  // ─── Handlers ────────────────────────────────────────────────────────

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleActivoAction(userId, !activo);
      if (result.error) toast.error(result.error);
      else toast.success(result.message);
    });
  }

  function handleChangePassword() {
    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    startTransition(async () => {
      const result = await cambiarPasswordAction(userId, newPassword);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.message);
        setShowPassword(false);
        setNewPassword("");
      }
    });
  }

  function handleEditar() {
    if (editNombre.trim().length < 2) {
      toast.error("El nombre debe tener al menos 2 caracteres");
      return;
    }
    startTransition(async () => {
      const result = await editarUsuarioAction(userId, editNombre.trim(), editRole);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.message);
        setShowEditar(false);
      }
    });
  }

  function handleEliminar() {
    startTransition(async () => {
      const result = await eliminarUsuarioAction(userId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.message);
        setShowEliminar(false);
      }
    });
  }

  // ─── Render ──────────────────────────────────────────────────────────

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              disabled={isPending}
            >
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Acciones de {nombre}</span>
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              setEditNombre(nombre);
              setEditRole(role);
              setShowEditar(true);
            }}
          >
            <Pencil className="size-4 mr-2" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowPassword(true)}>
            <KeyRound className="size-4 mr-2" />
            Cambiar contraseña
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleToggle}
            className={activo ? "text-destructive" : "text-green-600"}
          >
            {activo ? (
              <>
                <UserX className="size-4 mr-2" />
                Desactivar
              </>
            ) : (
              <>
                <UserCheck className="size-4 mr-2" />
                Activar
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowEliminar(true)}
            className="text-destructive"
          >
            <Trash2 className="size-4 mr-2" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ── Dialog: Editar usuario ────────────────────────────────── */}
      <Dialog open={showEditar} onOpenChange={setShowEditar}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
            <DialogDescription>
              Modificar nombre y rol de <strong>{nombre}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-nombre">Nombre completo</Label>
              <Input
                id="edit-nombre"
                value={editNombre}
                onChange={(e) => setEditNombre(e.target.value)}
                minLength={2}
                maxLength={60}
                disabled={isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Rol</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEditRole("empleado")}
                  disabled={isPending}
                  className={[
                    "rounded-lg border-2 px-3 py-2.5 text-sm font-medium text-left transition-colors",
                    editRole === "empleado"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50",
                  ].join(" ")}
                >
                  <span className="block font-semibold">Empleado</span>
                  <span className="text-xs opacity-70">Registra cierres</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditRole("admin")}
                  disabled={isPending}
                  className={[
                    "rounded-lg border-2 px-3 py-2.5 text-sm font-medium text-left transition-colors",
                    editRole === "admin"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50",
                  ].join(" ")}
                >
                  <span className="block font-semibold">Admin</span>
                  <span className="text-xs opacity-70">Acceso total</span>
                </button>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowEditar(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button onClick={handleEditar} disabled={isPending}>
                {isPending ? "Guardando…" : "Guardar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Cambiar contraseña ────────────────────────────── */}
      <Dialog open={showPassword} onOpenChange={setShowPassword}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cambiar contraseña</DialogTitle>
            <DialogDescription>
              Nueva contraseña para <strong>{nombre}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-password">Nueva contraseña</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                disabled={isPending}
                onKeyDown={(e) => e.key === "Enter" && handleChangePassword()}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowPassword(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button onClick={handleChangePassword} disabled={isPending}>
                {isPending ? "Guardando…" : "Guardar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Confirmar eliminación ─────────────────────────── */}
      <Dialog open={showEliminar} onOpenChange={setShowEliminar}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar usuario</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará a{" "}
              <strong>{nombre}</strong> del sistema por completo.
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
              {isPending ? "Eliminando…" : "Eliminar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
