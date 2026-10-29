import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/supabase/config";

/**
 * Proxy (antes "middleware"): refresca la sesión de Supabase en cada request.
 *
 * Los Server Components no pueden escribir cookies, así que sin esto el token
 * renovado nunca llegaba al navegador y la sesión terminaba revocada (había que
 * volver a iniciar sesión). Acá sí se escriben, y la cookie dura 400 días
 * (default de @supabase/ssr): la app instalada queda con la sesión guardada.
 *
 * Además, si ya hay sesión, "/" y "/login" van directo al dashboard (así la app
 * instalada abre en el dashboard y no en la portada).
 *
 * Corre en runtime Node.js (default de Proxy en Next 16). El intento anterior se
 * quitó porque corría en Edge, donde @supabase/ssr no carga.
 */
export async function proxy(request: NextRequest) {
  try {
    return await refreshSession(request);
  } catch (err) {
    // Nunca tumbar la app por el proxy (ver bitácora 2026-07-16): sin refresco,
    // cada página igual valida la sesión por su cuenta.
    console.error("Proxy: no se pudo refrescar la sesión:", err);
    return NextResponse.next({ request });
  }
}

async function refreshSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, anonKey } = getSupabaseConfig();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // No meter código entre createServerClient y getClaims (recomendación de Supabase).
  const { data } = await supabase.auth.getClaims();
  const loggedIn = Boolean(data?.claims);

  const { pathname } = request.nextUrl;
  if (loggedIn && (pathname === "/" || pathname === "/login")) {
    const target = request.nextUrl.clone();
    target.pathname = "/dashboard";
    target.search = "";
    const redirect = NextResponse.redirect(target);
    // Conservar las cookies recién refrescadas.
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  return response;
}

export const config = {
  matcher: [
    // Todo menos estáticos, íconos, manifest, service worker y APIs sin sesión.
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|api/version|api/paypal/webhook|api/cron|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
