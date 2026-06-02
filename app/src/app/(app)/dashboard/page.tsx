import type { Metadata } from "next";
import Link from "next/link";
import {
  TrendingUp,
  Wallet,
  Smartphone,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { requireRole } from "@/lib/supabase/session";
import { dateLong, money, moneyDecimal, todayISO } from "@/lib/format";
import { KpiCard } from "@/features/dashboard/kpi-card";
import { CierresTable } from "@/features/dashboard/cierres-table";
import {
  loadAlertas,
  loadCuadreHoy,
  loadCuadreUltimos,
} from "@/features/dashboard/loaders";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  await requireRole("admin");
  const [hoy, recientes, alertas] = await Promise.all([
    loadCuadreHoy(),
    loadCuadreUltimos(14),
    loadAlertas(5),
  ]);

  const sinCierre = !hoy;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          Panel administrador
        </p>
        <h1 className="text-2xl font-semibold capitalize">
          {dateLong(todayISO())}
        </h1>
      </header>

      {sinCierre && (
        <Card className="p-4 border-2 border-dashed bg-muted/30">
          <p className="text-sm text-muted-foreground">
            Hoy aún no hay cierre registrado por el empleado.
          </p>
        </Card>
      )}

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Ventas hoy"
          value={money(hoy?.ventas_tpv_total ?? 0)}
          hint={sinCierre ? "Sin datos" : `Base ${money(hoy?.base_inicial ?? 0)}`}
          icon={TrendingUp}
        />
        <KpiCard
          label="Efectivo esperado"
          value={money(hoy?.efectivo_esperado ?? 0)}
          hint={`Arqueo: ${money(hoy?.efectivo_arqueo ?? 0)}`}
          icon={Wallet}
        />
        <KpiCard
          label="Digital hoy"
          value={money(hoy?.ingresos_digitales_total ?? 0)}
          icon={Smartphone}
        />
        <KpiCard
          label="Diferencia"
          value={moneyDecimal(hoy?.diferencia ?? 0)}
          hint={
            hoy
              ? hoy.cuadrado
                ? "Cuadrado"
                : "Revisar"
              : "—"
          }
          tone={
            !hoy ? "default" : hoy.cuadrado ? "success" : "destructive"
          }
          icon={AlertTriangle}
        />
      </section>

      {alertas.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Alertas</h2>
            <Badge variant="destructive">{alertas.length}</Badge>
          </div>
          <ul className="space-y-2">
            {alertas.map((a) => (
              <li key={a.cierre_id}>
                <Link
                  href={`/dashboard/cierres/${a.cierre_id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border-2 border-destructive/30 bg-destructive/5 p-3 hover:bg-destructive/10 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">
                      Cierre descuadrado · {a.empleado ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.fecha} · diferencia {moneyDecimal(a.magnitud)}
                      {a.detalle && ` · ${a.detalle}`}
                    </p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Cierres recientes</h2>
          <Link
            href="/dashboard/cierres"
            className="text-sm text-primary hover:underline"
          >
            Ver todos
          </Link>
        </div>
        <CierresTable rows={recientes} />
      </section>
    </div>
  );
}
