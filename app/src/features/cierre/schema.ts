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
  base_billetes: money,
  base_monedas: money,
  base_inicial: money, // calculado: billetes + monedas
  base_confirmado: z.boolean(), // UI-only, no se persiste
  base_editado: z.boolean(), // se persiste, auditoría
});

export const PORCIONES_POR_RUEDA = 8;

export const pizzaStepSchema = z.object({
  pizza_ruedas_inicio: intNonNeg,
  pizza_porciones_inicio: intNonNeg,
  pizza_horneada: intNonNeg,
  pizza_ruedas_final: intNonNeg,
  pizza_porciones_final: intNonNeg,
  pizza_notas: z.string().max(280).optional().or(z.literal("")),
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
  arqueo_monedas: money,
});

export const resumenStepSchema = z.object({
  nota_diferencia: z.string().max(280).optional().or(z.literal("")),
});

export const cierreFullSchema = baseStepSchema
  .merge(pizzaStepSchema)
  .merge(ventasStepSchema)
  .merge(digitalesStepSchema)
  .merge(egresosStepSchema)
  .merge(arqueoStepSchema)
  .merge(resumenStepSchema);

export type CierreFormValues = z.infer<typeof cierreFullSchema>;

/**
 * Schema relajado para auto-save de borradores.
 * Acepta datos parciales — no exige cantidades positivas ni campos obligatorios en hijos.
 */
const draftMoney = z.number().nonnegative().default(0);
const draftInt = z.number().int().nonnegative().default(0);

export const cierreDraftSchema = z.object({
  base_billetes: draftMoney,
  base_monedas: draftMoney,
  base_inicial: draftMoney,
  base_confirmado: z.boolean().default(false),
  base_editado: z.boolean().default(false),
  pizza_ruedas_inicio: draftInt,
  pizza_porciones_inicio: draftInt,
  pizza_horneada: draftInt,
  pizza_ruedas_final: draftInt,
  pizza_porciones_final: draftInt,
  pizza_notas: z.string().max(280).optional().or(z.literal("")),
  ventas: z.array(z.object({
    producto_id: z.string(),
    cantidad: draftInt,
    precio_unitario: draftMoney,
  })).default([]),
  digitales: z.array(z.object({
    metodo: z.enum(["nequi", "transferencia", "datafono"]),
    monto: draftMoney,
    descripcion: z.string().max(140).optional().or(z.literal("")),
  })).default([]),
  egresos: z.array(z.object({
    concepto: z.string().max(140).default(""),
    categoria_id: z.string().default(""),
    unidad_id: z.string().default(""),
    monto: draftMoney,
    metodo_pago: z.enum(["efectivo", "transferencia"]).default("efectivo"),
  })).default([]),
  arqueo: z.array(z.object({
    denominacion_id: z.string(),
    valor: z.number().int().positive(),
    cantidad: draftInt,
  })).default([]),
  arqueo_monedas: draftMoney,
  nota_diferencia: z.string().max(280).optional().or(z.literal("")),
});
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
    v.egresos?.reduce((acc, e) => acc + (e.monto || 0), 0) ?? 0;
  const egresosTransfer = 0;
  const arqueoBilletes =
    v.arqueo?.reduce((acc, a) => acc + (a.valor || 0) * (a.cantidad || 0), 0) ?? 0;
  const arqueo = arqueoBilletes + (v.arqueo_monedas ?? 0);
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

/* ──────── Cálculo de pizza ────────
   disponible = (ruedas_inicio × 8 + porciones_inicio) + (horneada × 8)
   restante   = ruedas_final × 8 + porciones_final
   consumidas = disponible - restante
*/
export function calcPizza(v: Partial<CierreFormValues>) {
  const P = PORCIONES_POR_RUEDA;
  const inicio = (v.pizza_ruedas_inicio ?? 0) * P + (v.pizza_porciones_inicio ?? 0);
  const produccion = (v.pizza_horneada ?? 0) * P;
  const final_ = (v.pizza_ruedas_final ?? 0) * P + (v.pizza_porciones_final ?? 0);
  const disponible = inicio + produccion;
  const consumidas = disponible - final_;
  return { inicio, produccion, disponible, restante: final_, consumidas };
}
