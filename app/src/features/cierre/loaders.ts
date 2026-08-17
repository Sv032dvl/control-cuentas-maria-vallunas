/**
 * Cargadores server-side para el wizard de cierre.
 * Se ejecutan en el RSC `/cierre` antes de renderizar el wizard.
 */
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/format";
import { fetchLoyverseReceiptsByDate } from "@/lib/loyverse";
import type { Tables } from "@/lib/database.types";

export type CatalogProducto = Pick<
  Tables<"productos">,
  "id" | "nombre" | "precio" | "unidad_id" | "orden" | "multiplicador" | "tipo_pizza"
>;
export type CatalogUnidad = Pick<
  Tables<"unidades_negocio">,
  "id" | "nombre" | "acepta_gastos"
>;
export type CatalogCategoria = Pick<Tables<"categorias_egreso">, "id" | "nombre">;
export type CatalogDenominacion = Pick<
  Tables<"denominaciones_billete">,
  "id" | "valor"
>;
export type CatalogCuentaDigital = Pick<
  Tables<"cuentas_digitales">,
  "id" | "nombre" | "es_datafono"
>;

export type Catalogos = {
  productos: CatalogProducto[];
  unidades: CatalogUnidad[];
  categorias: CatalogCategoria[];
  denominaciones: CatalogDenominacion[];
  cuentas_digitales: CatalogCuentaDigital[];
};

export type CierreExistente = {
  id: string;
  estado: "abierto" | "cerrado";
  base_inicial: number;
  base_billetes: number;
  base_monedas: number;
  base_editado: boolean;
  updated_at: string;
  nota_diferencia: string | null;
  ventas: { producto_id: string; cantidad: number; precio_unitario: number }[];
  digitales: {
    cuenta_digital_id: string;
    monto: number;
    descripcion: string | null;
  }[];
  egresos: {
    concepto: string;
    categoria_id: string;
    unidad_id: string;
    monto: number;
    metodo_pago: "efectivo" | "transferencia";
  }[];
  arqueo: { denominacion_id: string; cantidad: number }[];
  arqueo_monedas: number;
} | null;

export async function loadCatalogos(): Promise<Catalogos> {
  const supabase = await createClient();
  const [productos, unidades, categorias, denominaciones, cuentas_digitales] = await Promise.all([
    supabase
      .from("productos")
      .select("id, nombre, precio, unidad_id, orden, multiplicador, tipo_pizza")
      .eq("activo", true)
      .order("orden")
      .order("nombre"),
    supabase
      .from("unidades_negocio")
      .select("id, nombre, acepta_gastos")
      .eq("activo", true)
      .order("nombre"),
    supabase
      .from("categorias_egreso")
      .select("id, nombre")
      .eq("activo", true)
      .order("nombre"),
    supabase
      .from("denominaciones_billete")
      .select("id, valor")
      .eq("activo", true)
      .order("valor"),
    supabase
      .from("cuentas_digitales")
      .select("id, nombre, es_datafono")
      .eq("activo", true)
      .order("orden")
      .order("nombre"),
  ]);

  return {
    productos: productos.data ?? [],
    unidades: unidades.data ?? [],
    categorias: categorias.data ?? [],
    denominaciones: denominaciones.data ?? [],
    cuentas_digitales: cuentas_digitales.data ?? [],
  };
}

export async function loadCierreByFecha(empleadoId: string, fecha: string): Promise<CierreExistente> {
  const supabase = await createClient();

  const { data: cierre } = await supabase
    .from("cierres_diarios")
    .select("id, estado, base_inicial, base_billetes, base_monedas, base_editado, arqueo_monedas, updated_at, nota_diferencia")
    .eq("fecha", fecha)
    .eq("empleado_id", empleadoId)
    .maybeSingle();

  if (!cierre) return null;

  const [ventas, digitales, egresos, arqueo] = await Promise.all([
    supabase
      .from("ventas_producto")
      .select("producto_id, cantidad, precio_unitario")
      .eq("cierre_id", cierre.id),
    supabase
      .from("ingresos_digitales")
      .select("cuenta_digital_id, monto, descripcion")
      .eq("cierre_id", cierre.id),
    supabase
      .from("egresos")
      .select("concepto, categoria_id, unidad_id, monto, metodo_pago")
      .eq("cierre_id", cierre.id),
    supabase
      .from("arqueo_billetes")
      .select("denominacion_id, cantidad")
      .eq("cierre_id", cierre.id),
  ]);

  return {
    id: cierre.id,
    estado: cierre.estado as "abierto" | "cerrado",
    base_inicial: Number(cierre.base_inicial),
    base_billetes: Number(cierre.base_billetes ?? 0),
    base_monedas: Number(cierre.base_monedas ?? 0),
    base_editado: Boolean(cierre.base_editado ?? false),
    arqueo_monedas: Number(cierre.arqueo_monedas ?? 0),
    updated_at: cierre.updated_at ?? new Date().toISOString(),
    nota_diferencia: cierre.nota_diferencia,
    ventas: (ventas.data ?? []).map((v) => ({
      producto_id: v.producto_id,
      cantidad: Number(v.cantidad),
      precio_unitario: Number(v.precio_unitario),
    })),
    digitales: (digitales.data ?? []).map((d) => ({
      cuenta_digital_id: d.cuenta_digital_id,
      monto: Number(d.monto),
      descripcion: d.descripcion,
    })),
    egresos: (egresos.data ?? []).map((e) => ({
      concepto: e.concepto,
      categoria_id: e.categoria_id,
      unidad_id: e.unidad_id,
      monto: Number(e.monto),
      metodo_pago: e.metodo_pago as "efectivo" | "transferencia",
    })),
    arqueo: (arqueo.data ?? []).map((a) => ({
      denominacion_id: a.denominacion_id,
      cantidad: Number(a.cantidad),
    })),
  };
}

// ─── Inventario de pizza ─────────────────────────────────────────────────────

export type PizzaExistente = {
  id: string;
  ruedas_inicio: number;
  porciones_inicio: number;
  horneada: number;
  ruedas_final: number;
  porciones_final: number;
  notas: string | null;
} | null;

export async function loadInventarioPizza(fecha: string): Promise<PizzaExistente> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("inventario_pizza")
    .select("id, ruedas_inicio, porciones_inicio, horneada, ruedas_final, porciones_final, notas")
    .eq("fecha", fecha)
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id,
    ruedas_inicio: Number(data.ruedas_inicio),
    porciones_inicio: Number(data.porciones_inicio),
    horneada: Number(data.horneada),
    ruedas_final: Number(data.ruedas_final),
    porciones_final: Number(data.porciones_final),
    notas: data.notas,
  };
}

// ─── Loyverse TPV data ──────────────────────────────────────────────────────

export type LoyverseVenta = {
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
};

export type LoyverseDigital = {
  monto: number;
  descripcion: string;
};

export type LoyverseData = {
  ventas: LoyverseVenta[];
  digitales: LoyverseDigital[];
  totalVentas: number;
  totalDigital: number;
} | null;

/**
 * Carga las ventas del día desde Loyverse y las cruza con productos en DB.
 * Retorna ventas agrupadas por producto + pagos con tarjeta como ingresos digitales.
 * Retorna null si la API falla (para no bloquear el cierre).
 */
export async function loadVentasLoyverse(fecha: string): Promise<LoyverseData> {
  try {
    const supabase = await createClient();

    // Cargar recibos de Loyverse y productos con loyverse_item_id en paralelo
    const [receipts, { data: productos }] = await Promise.all([
      fetchLoyverseReceiptsByDate(fecha),
      supabase
        .from("productos")
        .select("id, loyverse_item_id, precio")
        .not("loyverse_item_id", "is", null),
    ]);

    // Mapear loyverse_item_id → producto_id de Supabase
    const loyverseToProducto = new Map(
      (productos ?? []).map((p) => [p.loyverse_item_id!, { id: p.id, precio: Number(p.precio) }]),
    );

    // Agrupar line_items por item_id y sumar cantidades
    const ventasMap = new Map<string, { cantidad: number; precio: number }>();
    let totalDigital = 0;

    for (const receipt of receipts) {
      // Agrupar ventas por producto
      for (const item of receipt.line_items) {
        const existing = ventasMap.get(item.item_id);
        if (existing) {
          existing.cantidad += item.quantity;
        } else {
          ventasMap.set(item.item_id, {
            cantidad: item.quantity,
            precio: item.price,
          });
        }
      }

      // Sumar pagos con tarjeta (datafono)
      for (const payment of receipt.payments) {
        if (payment.type === "NONINTEGRATEDCARD") {
          totalDigital += payment.money_amount;
        }
      }
    }

    // Cruzar con productos en DB
    const ventas: LoyverseVenta[] = [];
    for (const [loyverseItemId, data] of ventasMap) {
      const producto = loyverseToProducto.get(loyverseItemId);
      if (producto) {
        ventas.push({
          producto_id: producto.id,
          cantidad: data.cantidad,
          precio_unitario: data.precio,
        });
      }
    }

    const totalVentas = ventas.reduce(
      (acc, v) => acc + v.cantidad * v.precio_unitario,
      0,
    );

    const digitales: LoyverseDigital[] = [];
    if (totalDigital > 0) {
      digitales.push({
        monto: totalDigital,
        descripcion: "Pagos con tarjeta (Loyverse)",
      });
    }

    return { ventas, digitales, totalVentas, totalDigital };
  } catch (err) {
    console.error("[loadVentasLoyverseHoy]", err);
    return null;
  }
}
