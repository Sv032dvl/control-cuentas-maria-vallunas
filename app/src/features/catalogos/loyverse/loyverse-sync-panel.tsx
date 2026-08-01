"use client";

import { useState, useTransition } from "react";
import {
  RefreshCw,
  Download,
  Check,
  X,
  Loader2,
  ArrowRight,
  Plus,
  Tag,
  Type,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { money } from "@/lib/format";
import {
  sincronizarConLoyverseAction,
  detectarCambiosLoyverseAction,
  aprobarCambioAction,
  rechazarCambioAction,
} from "../loyverse-sync-actions";
import type { Tables } from "@/lib/database.types";

type Pendiente = Tables<"sync_loyverse_pendientes">;

type Props = {
  pendientes: Pendiente[];
  hasSyncedBefore: boolean;
};

const TIPO_CONFIG: Record<
  string,
  { label: string; icon: typeof Plus; color: string }
> = {
  nuevo: { label: "Producto nuevo", icon: Plus, color: "text-green-600" },
  precio: { label: "Cambio de precio", icon: Tag, color: "text-blue-600" },
  nombre: { label: "Cambio de nombre", icon: Type, color: "text-amber-600" },
  eliminado: {
    label: "Eliminado en Loyverse",
    icon: Trash2,
    color: "text-red-600",
  },
};

export function LoyverseSyncPanel({ pendientes, hasSyncedBefore }: Props) {
  const [isPending, startTransition] = useTransition();
  const [action, setAction] = useState<string | null>(null);

  function handleSync() {
    setAction("sync");
    startTransition(async () => {
      const result = await sincronizarConLoyverseAction();
      if (result.error) toast.error(result.error);
      else toast.success(result.message);
      setAction(null);
    });
  }

  function handleDetectar() {
    setAction("detectar");
    startTransition(async () => {
      const result = await detectarCambiosLoyverseAction();
      if (result.error) toast.error(result.error);
      else toast.success(result.message);
      setAction(null);
    });
  }

  function handleAprobar(id: string) {
    setAction(`aprobar-${id}`);
    startTransition(async () => {
      const result = await aprobarCambioAction(id);
      if (result.error) toast.error(result.error);
      else toast.success(result.message);
      setAction(null);
    });
  }

  function handleRechazar(id: string) {
    setAction(`rechazar-${id}`);
    startTransition(async () => {
      const result = await rechazarCambioAction(id);
      if (result.error) toast.error(result.error);
      else toast.success(result.message);
      setAction(null);
    });
  }

  return (
    <div className="space-y-4">
      {/* Acciones */}
      <div className="flex flex-wrap gap-2">
        {!hasSyncedBefore && (
          <Button
            onClick={handleSync}
            disabled={isPending}
            variant="default"
          >
            {isPending && action === "sync" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Importar productos de Loyverse
          </Button>
        )}

        <Button
          onClick={handleDetectar}
          disabled={isPending}
          variant="outline"
        >
          {isPending && action === "detectar" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Verificar cambios
        </Button>

        {hasSyncedBefore && (
          <Button
            onClick={handleSync}
            disabled={isPending}
            variant="outline"
          >
            {isPending && action === "sync" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Re-sincronizar todo
          </Button>
        )}
      </div>

      {/* Lista de pendientes */}
      {pendientes.length === 0 ? (
        <Alert>
          <AlertDescription>
            No hay cambios pendientes. Usa &quot;Verificar cambios&quot; para
            comparar con Loyverse.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            {pendientes.length} cambio(s) pendientes de aprobacion
          </p>

          {pendientes.map((p) => {
            const config = TIPO_CONFIG[p.tipo] ?? TIPO_CONFIG.nuevo;
            const Icon = config.icon;
            const isLoading =
              isPending &&
              (action === `aprobar-${p.id}` || action === `rechazar-${p.id}`);

            return (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <Icon className={`h-4 w-4 shrink-0 ${config.color}`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${config.color}`}>
                      {config.label}
                    </span>
                    {p.categoria_loyverse && (
                      <span className="text-xs text-muted-foreground">
                        {p.categoria_loyverse}
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-medium truncate">
                    {p.nombre_loyverse}
                  </p>

                  {p.tipo === "precio" && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      {money(p.precio_actual)}
                      <ArrowRight className="h-3 w-3" />
                      <span className="font-medium text-foreground">
                        {money(p.precio_loyverse)}
                      </span>
                    </p>
                  )}

                  {p.tipo === "nombre" && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      {p.nombre_actual}
                      <ArrowRight className="h-3 w-3" />
                      <span className="font-medium text-foreground">
                        {p.nombre_loyverse}
                      </span>
                    </p>
                  )}

                  {p.tipo === "nuevo" && (
                    <p className="text-xs text-muted-foreground">
                      {money(p.precio_loyverse)}
                    </p>
                  )}
                </div>

                <div className="flex gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={() => handleAprobar(p.id)}
                    disabled={isLoading}
                    title="Aprobar"
                  >
                    {isLoading && action === `aprobar-${p.id}` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleRechazar(p.id)}
                    disabled={isLoading}
                    title="Rechazar"
                  >
                    {isLoading && action === `rechazar-${p.id}` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
