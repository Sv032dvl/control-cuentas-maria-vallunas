/**
 * Helpers de formato para Colombia (es-CO).
 * Centralizado para que cambiar moneda/locale sea trivial.
 */

const cop = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const copDecimal = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const integer = new Intl.NumberFormat("es-CO");

const longDate = new Intl.DateTimeFormat("es-CO", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const shortDate = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/** $ 18.500 (sin decimales por defecto, que es lo normal en COP). */
export function money(n: number | null | undefined) {
  if (n == null) return "—";
  return cop.format(n);
}

/** $ 18.500,75 (cuando importan los centavos, ej. diferencia de cuadre). */
export function moneyDecimal(n: number | null | undefined) {
  if (n == null) return "—";
  return copDecimal.format(n);
}

/** 1.234 */
export function integerN(n: number | null | undefined) {
  if (n == null) return "—";
  return integer.format(n);
}

/** "lunes, 1 de junio de 2026" */
export function dateLong(d: string | Date) {
  const date = typeof d === "string" ? new Date(`${d}T00:00:00`) : d;
  return longDate.format(date);
}

/** "01 jun 2026" */
export function dateShort(d: string | Date) {
  const date = typeof d === "string" ? new Date(`${d}T00:00:00`) : d;
  return shortDate.format(date);
}

/** Fecha actual en formato ISO YYYY-MM-DD para columnas `date` de Postgres. */
export function todayISO() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
