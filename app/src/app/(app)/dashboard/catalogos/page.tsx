import type { Metadata } from "next";
import { requireRole } from "@/lib/supabase/session";
import { createClient } from "@/lib/supabase/server";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProductosTable } from "@/features/catalogos/productos/productos-table";
import { CategoriasTable } from "@/features/catalogos/categorias/categorias-table";
import { UnidadesTable } from "@/features/catalogos/unidades/unidades-table";
import { DenominacionesTable } from "@/features/catalogos/denominaciones/denominaciones-table";

export const metadata: Metadata = { title: "Catálogos" };

export default async function CatalogosPage() {
  await requireRole("admin");
  const supabase = await createClient();

  const [
    { data: productos },
    { data: categorias },
    { data: unidades },
    { data: denominaciones },
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
  ]);

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
        </TabsList>

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
