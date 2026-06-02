"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, KeyRound, UserCheck, UserX } from "lucide-react";
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
import { toggleActivoAction, cambiarPasswordAction } from "./actions";

interface Props {
  userId: string;
  activo: boolean;
  nombre: string;
}

export function UsuarioAcciones({ userId, activo, nombre }: Props) {
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");

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
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog cambiar contraseña */}
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
    </>
  );
}
