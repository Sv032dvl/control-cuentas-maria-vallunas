/**
 * Supabase client para Server Components, Server Actions y Route Handlers.
 * Lee y escribe cookies a través del store de Next.js.
 *
 * Importante: NUNCA importes este archivo desde un Client Component;
 * usa `@/lib/supabase/client` allí.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll lanza cuando se llama desde un Server Component puro
            // (no Server Action). El middleware refrescará la sesión, así
            // que aquí podemos ignorarlo de forma segura.
          }
        },
      },
    },
  );
}
