"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoneyInput } from "@/features/cierre/components/money-input";
import { todayISO } from "@/lib/format";
import { facturaSchema, type FacturaFormValues, type Factura } from "./schema";
import { crearFactura, editarFactura } from "./actions";

type Props = {
  factura?: Factura;
  onSuccess: () => void;
};

export function FacturaForm({ factura, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition();
  const isEdit = !!factura;

  const form = useForm<FacturaFormValues>({
    resolver: zodResolver(facturaSchema),
    defaultValues: {
      proveedor: factura?.proveedor ?? "",
      numero_factura: factura?.numero_factura ?? "",
      fecha: factura?.fecha ?? todayISO(),
      fecha_vencimiento: factura?.fecha_vencimiento ?? "",
      monto: factura?.monto ?? 0,
      metodo_pago: (factura?.metodo_pago as FacturaFormValues["metodo_pago"]) ?? "",
      nota: factura?.nota ?? "",
    },
  });

  const { register, setValue, watch, formState: { errors } } = form;

  function onSubmit(data: FacturaFormValues) {
    startTransition(async () => {
      const res = isEdit
        ? await editarFactura(factura!.id, data)
        : await crearFactura(data);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(isEdit ? "Factura actualizada" : "Factura creada");
      onSuccess();
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="proveedor">Proveedor *</Label>
        <Input
          id="proveedor"
          {...register("proveedor")}
          placeholder="ej. Distribuciones XYZ"
        />
        {errors.proveedor && (
          <p className="text-xs text-destructive">{errors.proveedor.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="numero_factura"># Factura</Label>
          <Input
            id="numero_factura"
            {...register("numero_factura")}
            placeholder="Opcional"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="monto">Monto *</Label>
          <MoneyInput
            id="monto"
            value={watch("monto")}
            onValueChange={(n) => setValue("monto", n, { shouldValidate: true })}
          />
          {errors.monto && (
            <p className="text-xs text-destructive">{errors.monto.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="fecha">Fecha *</Label>
          <Input id="fecha" type="date" {...register("fecha")} />
          {errors.fecha && (
            <p className="text-xs text-destructive">{errors.fecha.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fecha_vencimiento">Vencimiento</Label>
          <Input
            id="fecha_vencimiento"
            type="date"
            {...register("fecha_vencimiento")}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Método de pago</Label>
        <Select
          value={watch("metodo_pago") || ""}
          onValueChange={(v) =>
            setValue("metodo_pago", v as FacturaFormValues["metodo_pago"], {
              shouldDirty: true,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Sin definir" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="efectivo">Efectivo</SelectItem>
            <SelectItem value="transferencia">Transferencia</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="nota">Nota</Label>
        <Textarea
          id="nota"
          {...register("nota")}
          placeholder="Observaciones opcionales..."
          maxLength={280}
          rows={2}
        />
      </div>

      <Button type="submit" disabled={isPending} className="w-full h-11">
        {isPending && <Loader2 className="size-4 animate-spin" />}
        {isEdit ? "Guardar cambios" : "Crear factura"}
      </Button>
    </form>
  );
}
