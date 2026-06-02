/**
 * Cargadores server-side para el wizard de cierre.
 * Se ejecutan en el RSC `/cierre` antes de renderizar el wizard.
 */
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/format";
import type { Tables } from "@/lib/database.types";

export type CatalogProducto = Pick<
  Tables<"productos">,
  "id" | "nombre" | "precio" | "unidad_id"
>;
export type CatalogUnidad = Pick<Tables<"unidades_negocio">, "id" | "nombre">;
export type CatalogCategoria = Pick<Tables<"categorias_egreso">, "id" | "nombre">;
export type CatalogDenominacion = Pick<
  Tables<"denominaciones_billete">,
  "id" | "valor"
>;

export type Catalogos = {
  productos: CatalogProducto[];
  unidades: CatalogUnidad[];
  categorias: CatalogCategoria[];
  denominaciones: CatalogDenominacion[];
};

export type CierreExistente = {
  id: string;
  estado: "abierto" | "cerrado";
  base_inicial: number;
  nota_diferencia: string | null;
  ventas: { producto_id: string; cantidad: number; precio_unitario: number }[];
  digitales: {
    metodo: "nequi" | "transferencia" | "datafono";
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
} | null;

export async function loadCatalogos(): Promise<Catalogos> {
  const supabase = await createClient();
  const [productos, unidades, categorias, denominaciones] = await Promise.all([
    supabase
      .from("productos")
      .select("id, nombre, precio, unidad_id")
      .eq("activo", true)
      .order("nombre"),
    supabase
      .from("unidades_negocio")
      .select("id, nombre")
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
  ]);

  return {
    productos: productos.data ?? [],
    unidades: unidades.data ?? [],
    categorias: categorias.data ?? [],
    denominaciones: denominaciones.data ?? [],
  };
}

export async function loadCierreHoy(empleadoId: string): Promise<CierreExistente> {
  const supabase = await createClient();
  const fecha = todayISO();

  const { data: cierre } = await supabase
    .from("cierres_diarios")
    .select("id, estado, base_inicial, nota_diferencia")
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
      .select("metodo, monto, descripcion")
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
    nota_diferencia: cierre.nota_diferencia,
    ventas: (ventas.data ?? []).map((v) => ({
      producto_id: v.producto_id,
      cantidad: Number(v.cantidad),
      precio_unitario: Number(v.precio_unitario),
    })),
    digitales: (digitales.data ?? []).map((d) => ({
      metodo: d.metodo as "nequi" | "transferencia" | "datafono",
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
