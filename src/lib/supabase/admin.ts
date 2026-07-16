import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase con service_role (SOLO servidor). Ignora RLS, así que
 * NUNCA debe exponerse al navegador ni usarse con datos de request sin validar.
 * Se usa para tareas administrativas como el cron de recurrentes.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
