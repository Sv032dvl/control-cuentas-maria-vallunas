"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/supabase/session";
import { createAdminClient } from "@/lib/supabase/admin";

type ActionResult = {
  success?: boolean;
  error?: string;
  message?: string;
};

const IdsSchema = z
  .array(z.string().uuid())
  .min(1, "Selecciona al menos un cierre");

export async function eliminarCierresAction(
  ids: string[],
): Promise<ActionResult> {
  await requireRole("admin");

  const parsed = IdsSchema.safeParse(ids);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "IDs inválidos" };
  }

  const supabase = createAdminClient();

  // Eliminar las tablas hijas primero manualmente para evitar
  // cualquier problema con CASCADE a nivel de PostgREST
  const childTables = [
    "ventas_producto",
    "ingresos_digitales",
    "egresos",
    "arqueo_billetes",
  ] as const;

  for (const table of childTables) {
    const { error: childError } = await supabase
      .from(table)
      .delete()
      .in("cierre_id", parsed.data);

    if (childError) {
      console.error(`[eliminarCierres] error borrando ${table}:`, childError);
      return { error: `Error al eliminar registros de ${table}` };
    }
  }

  // Ahora eliminar los cierres padres
  const { error, count } = await supabase
    .from("cierres_diarios")
    .delete({ count: "exact" })
    .in("id", parsed.data);

  if (error) {
    console.error("[eliminarCierres]", error);
    return { error: `Error al eliminar los cierres: ${error.message}` };
  }

  revalidatePath("/dashboard/cierres");
  revalidatePath("/dashboard");
  return {
    success: true,
    message: `${count ?? parsed.data.length} cierre(s) eliminado(s)`,
  };
}
