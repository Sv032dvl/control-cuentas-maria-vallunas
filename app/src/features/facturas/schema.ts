import { z } from "zod";

export const facturaEstados = ["pendiente", "pagada", "vencida"] as const;
export type FacturaEstado = (typeof facturaEstados)[number];

export const metodosPago = ["efectivo", "transferencia"] as const;

export const facturaSchema = z.object({
  proveedor: z.string().min(2, "Mínimo 2 caracteres").max(100),
  numero_factura: z.string().max(50).optional().or(z.literal("")),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  fecha_vencimiento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida")
    .optional()
    .or(z.literal("")),
  monto: z
    .number({ message: "Ingrese un número" })
    .positive("Debe ser mayor a 0"),
  metodo_pago: z.enum(metodosPago).optional().or(z.literal("")),
  nota: z.string().max(280).optional().or(z.literal("")),
});

export type FacturaFormValues = z.infer<typeof facturaSchema>;

export type Factura = {
  id: string;
  proveedor: string;
  numero_factura: string | null;
  fecha: string;
  fecha_vencimiento: string | null;
  monto: number;
  estado: FacturaEstado;
  metodo_pago: string | null;
  fecha_pago: string | null;
  nota: string | null;
  created_at: string;
};
