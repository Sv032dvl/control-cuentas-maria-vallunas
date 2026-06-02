/**
 * Schemas zod para el cierre diario.
 * Cada paso del wizard usa una porción; el schema raíz se valida al guardar.
 */
import { z } from "zod";

const money = z
  .number({ message: "Ingrese un número" })
  .nonnegative("No puede ser negativo");

const positiveMoney = money.refine((n) => n > 0, "Debe ser mayor a 0");

const intNonNeg = z
  .number({ message: "Ingrese un número" })
  .int("Debe ser entero")
  .nonnegative("No puede ser negativo");

const intPositive = intNonNeg.refine((n) => n > 0, "Debe ser mayor a 0");

export const baseStepSchema = z.object({
  base_inicial: money,
});

export const ventaLineSchema = z.object({
  producto_id: z.string().uuid(),
  cantidad: intPositive,
  precio_unitario: money,
});

export const ventasStepSchema = z.object({
  ventas: z.array(ventaLineSchema),
});

export const digitalLineSchema = z.object({
  metodo: z.enum(["nequi", "transferencia", "datafono"]),
  monto: positiveMoney,
  descripcion: z.string().max(140).optional().or(z.literal("")),
});

export const digitalesStepSchema = z.object({
  digitales: z.array(digitalLineSchema),
});

export const egresoLineSchema = z.object({
  concepto: z.string().min(2, "Concepto corto").max(140),
  categoria_id: z.string().uuid("Selecciona categoría"),
  unidad_id: z.string().uuid("Selecciona unidad"),
  monto: positiveMoney,
  metodo_pago: z.enum(["efectivo", "transferencia"]),
});

export const egresosStepSchema = z.object({
  egresos: z.array(egresoLineSchema),
});

export const arqueoLineSchema = z.object({
  denominacion_id: z.string().uuid(),
  valor: intPositive,
  cantidad: intNonNeg,
});

export const arqueoStepSchema = z.object({
  arqueo: z.array(arqueoLineSchema),
});

export const resumenStepSchema = z.object({
  nota_diferencia: z.string().max(280).optional().or(z.literal("")),
});

export const cierreFullSchema = baseStepSchema
  .merge(ventasStepSchema)
  .merge(digitalesStepSchema)
  .merge(egresosStepSchema)
  .merge(arqueoStepSchema)
  .merge(resumenStepSchema);

export type CierreFormValues = z.infer<typeof cierreFullSchema>;
export type VentaLine = z.infer<typeof ventaLineSchema>;
export type DigitalLine = z.infer<typeof digitalLineSchema>;
export type EgresoLine = z.infer<typeof egresoLineSchema>;
export type ArqueoLine = z.infer<typeof arqueoLineSchema>;

/* ──────── Ecuación maestra ────────
   ventas_tpv  =  digital + (efectivo_arqueo - base_inicial) + egresos_efectivo + diferencia
   efectivo_esperado = base_inicial + ventas_tpv - digital - egresos_efectivo
   diferencia        = efectivo_arqueo - efectivo_esperado
*/

export function calcTotales(v: Partial<CierreFormValues>) {
  const ventasTpv =
    v.ventas?.reduce((acc, l) => acc + (l.cantidad || 0) * (l.precio_unitario || 0), 0) ?? 0;
  const digital =
    v.digitales?.reduce((acc, l) => acc + (l.monto || 0), 0) ?? 0;
  const egresosEfectivo =
    v.egresos
      ?.filter((e) => e.metodo_pago === "efectivo")
      .reduce((acc, e) => acc + (e.monto || 0), 0) ?? 0;
  const egresosTransfer =
    v.egresos
      ?.filter((e) => e.metodo_pago === "transferencia")
      .reduce((acc, e) => acc + (e.monto || 0), 0) ?? 0;
  const arqueo =
    v.arqueo?.reduce((acc, a) => acc + (a.valor || 0) * (a.cantidad || 0), 0) ?? 0;
  const base = v.base_inicial ?? 0;

  const efectivoEsperado = base + ventasTpv - digital - egresosEfectivo;
  const diferencia = arqueo - efectivoEsperado;
  const cuadrado = Math.abs(diferencia) < 1; // tolerancia $1

  return {
    ventasTpv,
    digital,
    egresosEfectivo,
    egresosTransfer,
    arqueo,
    base,
    efectivoEsperado,
    diferencia,
    cuadrado,
  };
}
