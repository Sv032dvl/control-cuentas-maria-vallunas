import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertTriangle, Pizza } from "lucide-react";
import { requireRole } from "@/lib/supabase/session";
import { createClient } from "@/lib/supabase/server";
import {
  dateLong,
  money,
  moneyDecimal,
} from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Detalle de cierre" };

type Params = { params: Promise<{ id: string }> };

export default async function CierreDetailPage({ params }: Params) {
  await requireRole("admin");
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: cuadre },
    { data: ventas },
    { data: digitales },
    { data: egresos },
    { data: arqueo },
    { data: liquidaciones },
  ] =
    await Promise.all([
      supabase.from("v_cuadre_diario").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("ventas_producto")
        .select("cantidad, precio_unitario, total, productos(nombre, unidades_negocio(nombre))")
        .eq("cierre_id", id),
      supabase
        .from("ingresos_digitales")
        .select("cuenta_digital_id, monto, descripcion, cuentas_digitales(nombre)")
        .eq("cierre_id", id),
      supabase
        .from("egresos")
        .select(
          "concepto, monto, metodo_pago, categorias_egreso(nombre), unidades_negocio(nombre)",
        )
        .eq("cierre_id", id),
      supabase
        .from("arqueo_billetes")
        .select("cantidad, denominaciones_billete(valor)")
        .eq("cierre_id", id),
      // La liquidación vive en cierres_diarios, no en la vista de cuadre
      supabase
        .from("cierres_diarios")
        .select(
          "pizzeria_ingresos, pizzeria_gastos, pizzeria_liquidacion, pizzas_tradicionales, pizzas_especiales, recaudo_terceros_total, empanadas_ingresos, empanadas_gastos, empanadas_liquidacion",
        )
        .eq("id", id)
        .maybeSingle(),
    ]);

  if (!cuadre) return notFound();

  const ventasRows = ventas ?? [];
  const digRows = digitales ?? [];
  const egrRows = egresos ?? [];
  const arqRows = arqueo ?? [];

  const cuadrado = Boolean(cuadre.cuadrado);
  const diferencia = Number(cuadre.diferencia ?? 0);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Link
          href="/dashboard/cierres"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Volver
        </Link>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Cierre del
            </p>
            <h1 className="text-2xl font-semibold capitalize">
              {dateLong(cuadre.fecha ?? "")}
            </h1>
            <p className="text-sm text-muted-foreground">
              Empleado: {cuadre.empleado_nombre ?? "—"}
            </p>
          </div>
          {cuadrado ? (
            <Badge className="bg-success text-success-foreground">
              <CheckCircle2 className="size-3.5" /> Cuadrado
            </Badge>
          ) : (
            <Badge variant="destructive">
              <AlertTriangle className="size-3.5" /> Descuadrado
            </Badge>
          )}
        </div>
      </header>

      <Card
        className={cn(
          "p-4 border-2",
          cuadrado ? "border-success bg-success/5" : "border-destructive bg-destructive/5",
        )}
      >
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Diferencia
        </p>
        <p className="text-3xl font-bold tabular-nums">
          {moneyDecimal(diferencia)}
        </p>
        {cuadre.nota_diferencia && (
          <p className="mt-2 text-sm text-foreground/80 italic">
            “{cuadre.nota_diferencia}”
          </p>
        )}
      </Card>

      <section className="grid sm:grid-cols-2 gap-3">
        <Card className="p-4 space-y-2">
          <h3 className="text-sm font-semibold">Resumen</h3>
          <Row label="Base inicial" value={money(Number(cuadre.base_inicial ?? 0))} bold />
          {(Number(cuadre.base_billetes ?? 0) > 0 || Number(cuadre.base_monedas ?? 0) > 0) && (
            <>
              <Row label="  Billetes" value={money(Number(cuadre.base_billetes ?? 0))} />
              <Row label="  Monedas" value={money(Number(cuadre.base_monedas ?? 0))} />
            </>
          )}
          {cuadre.base_editado && (
            <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangle className="size-3" />
              <span>Base editada tras confirmacion</span>
            </div>
          )}
          <Row label="Ventas TPV" value={money(Number(cuadre.ventas_tpv_total ?? 0))} />
          {Number(liquidaciones?.recaudo_terceros_total ?? 0) > 0 && (
            <>
              <Row
                label="  Domicilios (del mensajero)"
                value={money(Number(liquidaciones?.recaudo_terceros_total ?? 0))}
              />
              <Row
                label="  Venta real del negocio"
                value={money(
                  Number(cuadre.ventas_tpv_total ?? 0) -
                    Number(liquidaciones?.recaudo_terceros_total ?? 0),
                )}
              />
            </>
          )}
          <Row label="Digital" value={money(Number(cuadre.ingresos_digitales_total ?? 0))} />
          <Row label="Gastos efectivo" value={money(Number(cuadre.egresos_efectivo_total ?? 0))} />
          <Row label="Gastos transferencia" value={money(Number(cuadre.egresos_transferencia_total ?? 0))} />
          <Row label="Efectivo esperado" value={money(Number(cuadre.efectivo_esperado ?? 0))} bold />
          <Row label="Efectivo contado" value={money(Number(cuadre.efectivo_arqueo ?? 0))} bold />
        </Card>

        <Card className="p-4 space-y-2">
          <h3 className="text-sm font-semibold">Arqueo</h3>
          {arqRows.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Sin datos</p>
          ) : (
            arqRows.map((a, i) => {
              const valor = Number(
                Array.isArray(a.denominaciones_billete)
                  ? a.denominaciones_billete[0]?.valor
                  : a.denominaciones_billete?.valor ?? 0,
              );
              return (
                <Row
                  key={i}
                  label={`${a.cantidad} × ${money(valor)}`}
                  value={money(a.cantidad * valor)}
                />
              );
            })
          )}
        </Card>

        {liquidaciones && (Number(liquidaciones.empanadas_ingresos ?? 0) > 0 ||
          Number(liquidaciones.empanadas_gastos ?? 0) > 0) && (
          <Card className="p-4 space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <span>🥟</span>
              Liquidación Empanadas
            </h3>
            <p className="text-xs text-muted-foreground -mt-1">
              Empanadas, arepas y bebidas
            </p>
            <Row label="Ingresos" value={money(Number(liquidaciones.empanadas_ingresos ?? 0))} />
            <Row label="Gastos" value={money(Number(liquidaciones.empanadas_gastos ?? 0))} />
            <Row
              label="Le corresponde"
              value={money(Number(liquidaciones.empanadas_liquidacion ?? 0))}
              bold
            />
          </Card>
        )}

        {liquidaciones && (Number(liquidaciones.pizzeria_ingresos ?? 0) > 0 ||
          Number(liquidaciones.pizzeria_gastos ?? 0) > 0) && (
          <Card className="p-4 space-y-2 border-orange-200/70 bg-orange-50/50 dark:border-orange-800/40 dark:bg-orange-950/20">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <Pizza className="size-4 text-orange-600 dark:text-orange-400" />
              Liquidación Pizzería
            </h3>
            <Row label="Ingresos" value={money(Number(liquidaciones.pizzeria_ingresos ?? 0))} />
            <Row label="Gastos" value={money(Number(liquidaciones.pizzeria_gastos ?? 0))} />
            <Row
              label="Le corresponde"
              value={money(Number(liquidaciones.pizzeria_liquidacion ?? 0))}
              bold
            />
            <hr className="border-orange-200/70 dark:border-orange-800/40 my-1" />
            <Row
              label="Pizzas vendidas"
              value={String(
                Number(liquidaciones.pizzas_tradicionales ?? 0) +
                  Number(liquidaciones.pizzas_especiales ?? 0),
              )}
              bold
            />
            <Row
              label="  Tradicionales"
              value={String(Number(liquidaciones.pizzas_tradicionales ?? 0))}
            />
            <Row
              label="  Especiales"
              value={String(Number(liquidaciones.pizzas_especiales ?? 0))}
            />
          </Card>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Ventas</h3>
        {ventasRows.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Sin ventas</p>
        ) : (
          <ul className="space-y-1.5">
            {ventasRows.map((v, i) => {
              const prod = Array.isArray(v.productos) ? v.productos[0] : v.productos;
              const unidad = Array.isArray(prod?.unidades_negocio)
                ? prod?.unidades_negocio?.[0]
                : prod?.unidades_negocio;
              return (
                <li
                  key={i}
                  className="flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{prod?.nombre ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {unidad?.nombre ?? "—"} · {v.cantidad} × {money(Number(v.precio_unitario))}
                    </p>
                  </div>
                  <span className="tabular-nums font-medium">
                    {money(Number(v.total ?? 0))}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Ingresos digitales</h3>
          {digRows.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Sin movimientos</p>
          ) : (
            <ul className="space-y-1.5">
              {digRows.map((d, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{d.cuentas_digitales?.nombre ?? "—"}</p>
                    {d.descripcion && (
                      <p className="text-xs text-muted-foreground">{d.descripcion}</p>
                    )}
                  </div>
                  <span className="tabular-nums font-medium">
                    {money(Number(d.monto))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Gastos</h3>
          {egrRows.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Sin gastos</p>
          ) : (
            <ul className="space-y-1.5">
              {egrRows.map((e, i) => {
                const cat = Array.isArray(e.categorias_egreso)
                  ? e.categorias_egreso[0]
                  : e.categorias_egreso;
                const uni = Array.isArray(e.unidades_negocio)
                  ? e.unidades_negocio[0]
                  : e.unidades_negocio;
                return (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{e.concepto}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {cat?.nombre ?? "—"} · {uni?.nombre ?? "—"}
                      </p>
                    </div>
                    <span className="tabular-nums font-medium">
                      {money(Number(e.monto))}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className={cn("flex justify-between text-sm", bold && "font-semibold")}>
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
