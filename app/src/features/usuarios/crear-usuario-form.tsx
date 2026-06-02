"use client";

import { useActionState } from "react";
import { useEffect, useRef } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { crearUsuarioAction, type UsuarioActionState } from "./actions";
import { toast } from "sonner";

export function CrearUsuarioForm() {
  const [state, formAction, pending] = useActionState<
    UsuarioActionState | undefined,
    FormData
  >(crearUsuarioAction, undefined);

  const formRef = useRef<HTMLFormElement>(null);

  // Toast en éxito y reset del form
  useEffect(() => {
    if (state?.success) {
      toast.success(state.message ?? "Usuario creado");
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button size="sm">
            <UserPlus className="size-4 mr-2" />
            Nuevo usuario
          </Button>
        }
      />

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear usuario</DialogTitle>
          <DialogDescription>
            El usuario podrá entrar de inmediato con las credenciales que definas.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="space-y-4 mt-2">
          {/* Nombre */}
          <div className="space-y-1.5">
            <Label htmlFor="nombre">Nombre completo</Label>
            <Input
              id="nombre"
              name="nombre"
              placeholder="Ej. María García"
              required
              minLength={2}
              maxLength={60}
              disabled={pending}
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              placeholder="maria@gmail.com"
              required
              disabled={pending}
            />
          </div>

          {/* Contraseña */}
          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              disabled={pending}
            />
          </div>

          {/* Rol */}
          <div className="space-y-1.5">
            <Label htmlFor="role">Rol</Label>
            <Select name="role" defaultValue="empleado" disabled={pending}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="empleado">
                  Empleado — registra cierres nocturnos
                </SelectItem>
                <SelectItem value="admin">
                  Admin — acceso total al dashboard
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Error */}
          {state?.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Creando…
              </>
            ) : (
              "Crear usuario"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
