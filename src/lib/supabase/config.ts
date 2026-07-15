/**
 * Lee y valida las variables de entorno de Supabase, con mensajes claros
 * si falta algo o el valor está mal formado.
 */

function requireEnv(name: string, value: string | undefined): string {
  const v = (value ?? "").trim();
  if (v === "") {
    throw new Error(
      `Falta la variable ${name} en .env.local. Copiala desde Supabase → ` +
        `Project Settings → API y reiniciá el servidor (npm run dev).`,
    );
  }
  return v;
}

export function getSupabaseConfig(): { url: string; anonKey: string } {
  const url = requireEnv(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  );
  const anonKey = requireEnv(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL no es una URL válida: "${url}". ` +
        `Debe verse como https://xxxxx.supabase.co, sin comillas ni texto ` +
        `extra (ej. no incluyas "URL:" al inicio).`,
    );
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL debe empezar con https:// — recibí: "${url}".`,
    );
  }

  return { url, anonKey };
}
