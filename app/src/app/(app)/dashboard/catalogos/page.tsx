import type { Metadata } from "next";
import { requireRole } from "@/lib/supabase/session";
import { createClient } from "@/lib/supabase/server";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProductosTable } from "@/features/catalogos/productos/productos-table";
import { CategoriasTable } from "@/features/catalogos/categorias/categorias-table";
import { UnidadesTable } from "@/features/catalogos/unidades/unidades-table";
import { DenominacionesTable } from "@/features/catalogos/denominaciones/denominaciones-table";
import { LoyverseSyncPanel } from "@/features/catalogos/loyverse/loyverse-sync-panel";

export const metadata: Metadata = { title: "Catálogos" };

export default async function CatalogosPage() {
  await requireRole("admin");
  const supabase = await createClient();

  const [
    { data: productos },
    { data: categorias },
    { data: unidades },
    { data: denominaciones },
    { data: pendientes },
  ] = await Promise.all([
    supabase
      .from("productos")
      .select("*, unidades_negocio(nombre)")
      .order("nombre"),
    supabase
      .from("categorias_egreso")
      .select("*")
      .order("nombre"),
    supabase
      .from("unidades_negocio")
      .select("*")
      .order("nombre"),
    supabase
      .from("denominaciones_billete")
      .select("*")
      .order("valor", { ascending: true }),
    supabase
      .from("sync_loyverse_pendientes")
      .select("*")
      .eq("estado", "pendiente")
      .order("created_at", { ascending: false }),
  ]);

  // Determinar si ya se ha hecho la sincronización inicial
  const hasSyncedBefore = (productos ?? []).some(
    (p: { loyverse_item_id?: string | null }) => p.loyverse_item_id != null,
  );

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          Configuración
        </p>
        <h1 className="text-2xl font-semibold">Catálogos</h1>
      </header>

      <Tabs defaultValue="productos">
        <TabsList>
          <TabsTrigger value="productos">
            Productos ({productos?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="categorias">
            Categorías ({categorias?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="unidades">
            Unidades ({unidades?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="denominaciones">
            Denominaciones ({denominaciones?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="loyverse">
            Loyverse
            {(pendientes?.length ?? 0) > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold h-5 min-w-5 px-1">
                {pendientes!.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="loyverse">
          <LoyverseSyncPanel
            pendientes={pendientes ?? []}
            hasSyncedBefore={hasSyncedBefore}
          />
        </TabsContent>

        <TabsContent value="productos">
          <ProductosTable
            productos={productos ?? []}
            unidades={unidades ?? []}
          />
        </TabsContent>

        <TabsContent value="categorias">
          <CategoriasTable categorias={categorias ?? []} />
        </TabsContent>

        <TabsContent value="unidades">
          <UnidadesTable unidades={unidades ?? []} />
        </TabsContent>

        <TabsContent value="denominaciones">
          <DenominacionesTable denominaciones={denominaciones ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
