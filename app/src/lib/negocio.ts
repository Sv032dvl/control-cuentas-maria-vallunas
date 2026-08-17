/**
 * Constantes de dominio del negocio.
 *
 * "María Vallunas" es una sola caja registradora con **dos dueños**:
 *   1. Empanadas → empanadas, arepas y bebidas
 *   2. Pizzería  → pizza
 *
 * Cada unidad de negocio lleva su `propietario` (1, 2 o null). El cierre
 * diario liquida por separado lo que le corresponde a cada uno:
 * sus ventas menos sus gastos.
 *
 * Las unidades sin dueño quedan fuera de ambas liquidaciones: `Domicilios`
 * porque es recaudo para el mensajero, y `Adiciones`/`Compartido` porque
 * están vacías.
 */
export const PROPIETARIOS = [
  { id: 1, nombre: "Empanadas", emoji: "🥟" },
  { id: 2, nombre: "Pizzería", emoji: "🍕" },
] as const;

export type PropietarioId = (typeof PROPIETARIOS)[number]["id"];

export function nombrePropietario(id: number | null): string {
  return PROPIETARIOS.find((p) => p.id === id)?.nombre ?? "Sin dueño";
}

/** Unidad de Pizzería. Se usa para el inventario de pizza, que es específico de ella. */
export const UNIDAD_PIZZERIA_ID = "75340370-d308-44ff-9cce-74bcfc0358ed";

/** Clasificación de pizza. `null` en el producto significa que no es una pizza. */
export const TIPOS_PIZZA = ["tradicional", "especial"] as const;
export type TipoPizza = (typeof TIPOS_PIZZA)[number];
