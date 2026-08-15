/**
 * Constantes de dominio del negocio.
 *
 * "María Vallunas" es una sola caja con dos propietarios:
 *   - Propietario 1: Empanadas, Arepas, Bebidas
 *   - Propietario 2: Pizzería
 *
 * El cierre diario liquida por separado lo que le corresponde a Pizzería.
 */
export const UNIDAD_PIZZERIA_ID = "75340370-d308-44ff-9cce-74bcfc0358ed";

/** Clasificación de pizza. `null` en el producto significa que no es una pizza. */
export const TIPOS_PIZZA = ["tradicional", "especial"] as const;
export type TipoPizza = (typeof TIPOS_PIZZA)[number];
