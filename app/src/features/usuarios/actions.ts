"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/supabase/session";

// ─── Schemas ────────────────────────────────────────────────────────────────

const CrearUsuarioSchema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres").max(60),
  email: z.string().email("Email inválido"),
  password: z
    .string()
    .min(6, "Mínimo 6 caracteres")
    .max(72, "Máximo 72 caracteres"),
  role: z.enum(["empleado", "admin"]),
});

const ToggleActivoSchema = z.object({
  userId: z.string().uuid(),
  activo: z.boolean(),
});

export type UsuarioActionState = {
  success?: boolean;
  error?: string;
  message?: string;
};

// ─── Crear usuario ────────────────────────────────────────────────────────────

export async function crearUsuarioAction(
  _prev: UsuarioActionState | undefined,
  formData: FormData,
): Promise<UsuarioActionState> {
  // Solo admin puede crear usuarios
  await requireRole("admin");

  const parsed = CrearUsuarioSchema.safeParse({
    nombre: formData.get("nombre"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { nombre, email, password, role } = parsed.data;

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    console.error("[crearUsuario] createAdminClient falló:", e);
    return { error: "Error de configuración del servidor. Contacta al administrador." };
  }

  // 1. Crear usuario en Auth con email ya confirmado
  const { data, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre },
  });

  if (authError) {
    console.error("[crearUsuario] authError:", authError);
    if (
      authError.message.includes("already registered") ||
      authError.message.includes("already been registered")
    ) {
      return { error: "Ya existe un usuario con ese email" };
    }
    return { error: `Error al crear usuario: ${authError.message}` };
  }

  if (!data?.user) {
    return { error: "No se pudo crear el usuario, intenta de nuevo" };
  }

  // 2. Esperar brevemente a que el trigger handle_new_user cree el profile
  await new Promise((r) => setTimeout(r, 800));

  // 3. Verificar si el profile existe
  const { data: existingProfile, error: selectError } = await admin
    .from("profiles")
    .select("id")
    .eq("id", data.user.id)
    .maybeSingle();

  if (selectError) {
    console.error("[crearUsuario] selectError:", JSON.stringify(selectError));
    await admin.auth.admin.deleteUser(data.user.id);
    return { error: "Error al verificar el perfil del usuario" };
  }

  // 4. Si no existe, crear el profile manualmente (el trigger falló o no existe)
  if (!existingProfile) {
    const { error: insertError } = await admin
      .from("profiles")
      .insert({
        id: data.user.id,
        nombre,
        role,
        activo: true,
      });

    if (insertError) {
      console.error("[crearUsuario] insertError:", JSON.stringify(insertError));
      await admin.auth.admin.deleteUser(data.user.id);
      return { error: "Error al crear el perfil del usuario" };
    }
  } else {
    // 5. Si existe, actualizar nombre y rol
    const { error: updateError } = await admin
      .from("profiles")
      .update({ nombre, role })
      .eq("id", data.user.id);

    if (updateError) {
      console.error("[crearUsuario] updateError:", JSON.stringify(updateError));
      await admin.auth.admin.deleteUser(data.user.id);
      return { error: "Error al actualizar el perfil del usuario" };
    }
  }

  revalidatePath("/dashboard/usuarios");
  return {
    success: true,
    message: `✅ Usuario "${nombre}" creado con rol ${role}`,
  };
}

// ─── Activar / desactivar usuario ────────────────────────────────────────────

export async function toggleActivoAction(
  userId: string,
  activo: boolean,
): Promise<UsuarioActionState> {
  await requireRole("admin");

  const parsed = ToggleActivoSchema.safeParse({ userId, activo });
  if (!parsed.success) return { error: "Datos inválidos" };

  const admin = createAdminClient();

  const { error } = await admin
    .from("profiles")
    .update({ activo })
    .eq("id", parsed.data.userId);

  if (error) return { error: "No se pudo actualizar el usuario" };

  revalidatePath("/dashboard/usuarios");
  return {
    success: true,
    message: activo ? "Usuario activado" : "Usuario desactivado",
  };
}

// ─── Cambiar contraseña ───────────────────────────────────────────────────────

// ─── Eliminar usuario ─────────────────────────────────────────────────────────

export async function eliminarUsuarioAction(
  userId: string,
): Promise<UsuarioActionState> {
  await requireRole("admin");

  const parsed = z.string().uuid().safeParse(userId);
  if (!parsed.success) return { error: "ID de usuario inválido" };

  const admin = createAdminClient();

  // 1. Eliminar profile
  const { error: profileError } = await admin
    .from("profiles")
    .delete()
    .eq("id", parsed.data);

  if (profileError) {
    console.error("[eliminarUsuario] profileError:", JSON.stringify(profileError));
    return { error: "Error al eliminar el perfil del usuario" };
  }

  // 2. Eliminar usuario de Auth
  const { error: authError } = await admin.auth.admin.deleteUser(parsed.data);

  if (authError) {
    console.error("[eliminarUsuario] authError:", authError);
    return { error: `Error al eliminar usuario: ${authError.message}` };
  }

  revalidatePath("/dashboard/usuarios");
  return { success: true, message: "Usuario eliminado" };
}

// ─── Editar usuario (nombre y/o rol) ─────────────────────────────────────────

const EditarUsuarioSchema = z.object({
  userId: z.string().uuid(),
  nombre: z.string().min(2, "Mínimo 2 caracteres").max(60),
  role: z.enum(["empleado", "admin"]),
});

export async function editarUsuarioAction(
  userId: string,
  nombre: string,
  role: "empleado" | "admin",
): Promise<UsuarioActionState> {
  await requireRole("admin");

  const parsed = EditarUsuarioSchema.safeParse({ userId, nombre, role });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from("profiles")
    .update({ nombre: parsed.data.nombre, role: parsed.data.role })
    .eq("id", parsed.data.userId);

  if (error) {
    console.error("[editarUsuario] error:", JSON.stringify(error));
    return { error: "Error al actualizar el usuario" };
  }

  // Actualizar también user_metadata en Auth
  await admin.auth.admin.updateUserById(parsed.data.userId, {
    user_metadata: { nombre: parsed.data.nombre },
  });

  revalidatePath("/dashboard/usuarios");
  return { success: true, message: `Usuario "${parsed.data.nombre}" actualizado` };
}

// ─── Cambiar contraseña ───────────────────────────────────────────────────────

const CambiarPasswordSchema = z.object({
  userId: z.string().uuid(),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
});

export async function cambiarPasswordAction(
  userId: string,
  password: string,
): Promise<UsuarioActionState> {
  await requireRole("admin");

  const parsed = CambiarPasswordSchema.safeParse({ userId, password });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const admin = createAdminClient();

  const { error } = await admin.auth.admin.updateUserById(
    parsed.data.userId,
    { password: parsed.data.password },
  );

  if (error) return { error: `Error al cambiar contraseña: ${error.message}` };

  return { success: true, message: "Contraseña actualizada" };
}
