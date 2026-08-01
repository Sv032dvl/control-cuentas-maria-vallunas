/**
 * Cliente server-side para la API REST de Loyverse.
 * Solo usar en Server Actions / Route Handlers — NUNCA en client components.
 */

const BASE_URL = "https://api.loyverse.com/v1.0";

function getToken(): string {
  const token = process.env.LOYVERSE_API_TOKEN;
  if (!token) throw new Error("Falta la variable de entorno LOYVERSE_API_TOKEN");
  return token;
}

async function loyverseFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Loyverse API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// ─── Types ──────────────────────────────────────────────────────────────────

export type LoyverseVariant = {
  variant_id: string;
  default_price: number | null;
  stores: { store_id: string; price: number; available_for_sale: boolean }[];
};

export type LoyverseItem = {
  id: string;
  item_name: string;
  category_id: string | null;
  deleted_at: string | null;
  variants: LoyverseVariant[];
};

export type LoyverseCategory = {
  id: string;
  name: string;
};

export type LoyverseLineItem = {
  item_id: string;
  item_name: string;
  quantity: number;
  price: number;
  total_money: number;
};

export type LoyversePayment = {
  payment_type_id: string;
  type: "CASH" | "NONINTEGRATEDCARD" | string;
  name: string;
  money_amount: number;
};

export type LoyverseReceipt = {
  receipt_number: string;
  receipt_type: "SALE" | "REFUND";
  receipt_date: string;
  total_money: number;
  store_id: string;
  employee_id: string | null;
  customer_id: string | null;
  line_items: LoyverseLineItem[];
  payments: LoyversePayment[];
};

// ─── API calls ──────────────────────────────────────────────────────────────

/** Obtener todos los items (productos) con paginación automática. */
export async function fetchLoyverseItems(): Promise<LoyverseItem[]> {
  const items: LoyverseItem[] = [];
  let cursor: string | undefined;

  do {
    const params = new URLSearchParams({ limit: "250" });
    if (cursor) params.set("cursor", cursor);

    const data = await loyverseFetch<{ items: LoyverseItem[]; cursor?: string }>(
      `/items?${params}`,
    );
    items.push(...data.items);
    cursor = data.cursor;
  } while (cursor);

  // Solo activos (no eliminados)
  return items.filter((i) => !i.deleted_at);
}

/** Obtener todas las categorías. */
export async function fetchLoyverseCategories(): Promise<LoyverseCategory[]> {
  const data = await loyverseFetch<{ categories: LoyverseCategory[] }>("/categories");
  return data.categories;
}

/** Obtener recibos de un día específico (zona horaria Colombia = UTC-5). */
export async function fetchLoyverseReceiptsByDate(
  fecha: string,
): Promise<LoyverseReceipt[]> {
  // fecha viene como "2026-08-01" (formato ISO date)
  // Colombia = UTC-5, así que el día empieza a las 05:00 UTC
  const min = `${fecha}T05:00:00.000Z`;
  const nextDay = new Date(`${fecha}T05:00:00.000Z`);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  const max = nextDay.toISOString();

  const receipts: LoyverseReceipt[] = [];
  let cursor: string | undefined;

  do {
    const params = new URLSearchParams({
      limit: "250",
      created_at_min: min,
      created_at_max: max,
    });
    if (cursor) params.set("cursor", cursor);

    const data = await loyverseFetch<{ receipts: LoyverseReceipt[]; cursor?: string }>(
      `/receipts?${params}`,
    );
    receipts.push(...data.receipts);
    cursor = data.cursor;
  } while (cursor);

  // Solo ventas (no reembolsos)
  return receipts.filter((r) => r.receipt_type === "SALE");
}

/** Extraer el precio de un item para la tienda María Vallunas. */
export function getItemPrice(item: LoyverseItem): number {
  const STORE_ID = "1c0e1ec9-32b7-4e47-802f-dc9423cc31a4";
  const variant = item.variants[0];
  if (!variant) return 0;

  const storePrice = variant.stores.find((s) => s.store_id === STORE_ID);
  return storePrice?.price ?? variant.default_price ?? 0;
}
