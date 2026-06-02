"use client";

import { useActionState } from "react";
import { useEffect, useRef, useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [open, setOpen] = useState(false);
  // rol en estado local + hidden input → FormData lo lee correctamente
  const [role, setRole] = useState<"empleado" | "admin">("empleado");

  const [state, formAction, pending] = useActionState<
    UsuarioActionState | undefined,
    FormData
  >(crearUsuarioAction, undefined);

  const formRef = useRef<HTMLFormElement>(null);

  // Cerrar diálogo + toast en éxito
  useEffect(() => {
    if (state?.success) {
      toast.success(state.message ?? "Usuario creado");
      setOpen(false);
      setRole("empleado");
    }
  }, [state]);

  // Resetear form cuando el diálogo se abre de nuevo
  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      formRef.current?.reset();
      setRole("empleado");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
            <Label htmlFor="c-nombre">Nombre completo</Label>
            <Input
              id="c-nombre"
              name="nombre"
              placeholder="Ej. María García"
              required
              minLength={2}
              maxLength={60}
              disabled={pending}
              autoComplete="off"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="c-email">Correo electrónico</Label>
            <Input
              id="c-email"
              name="email"
              type="email"
              inputMode="email"
              placeholder="maria@gmail.com"
              required
              disabled={pending}
              autoComplete="off"
            />
          </div>

          {/* Contraseña */}
          <div className="space-y-1.5">
            <Label htmlFor="c-password">Contraseña</Label>
            <Input
              id="c-password"
              name="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              disabled={pending}
              autoComplete="new-password"
            />
          </div>

          {/* Rol — botones nativos + hidden input para FormData */}
          <div className="space-y-1.5">
            <Label>Rol</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole("empleado")}
                disabled={pending}
                className={[
                  "rounded-lg border-2 px-3 py-2.5 text-sm font-medium text-left transition-colors",
                  role === "empleado"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50",
                ].join(" ")}
              >
                <span className="block font-semibold">Empleado</span>
                <span className="text-xs opacity-70">Registra cierres</span>
              </button>
              <button
                type="button"
                onClick={() => setRole("admin")}
                disabled={pending}
                className={[
                  "rounded-lg border-2 px-3 py-2.5 text-sm font-medium text-left transition-colors",
                  role === "admin"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50",
                ].join(" ")}
              >
                <span className="block font-semibold">Admin</span>
                <span className="text-xs opacity-70">Acceso total</span>
              </button>
            </div>
            {/* Hidden input que FormData sí puede leer */}
            <input type="hidden" name="role" value={role} />
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
                Creando usuario…
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
