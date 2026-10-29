/**
 * Devuelve la versión desplegada. La app (ServiceWorkerRegister) la compara
 * con la versión con la que se cargó para saber si hay una actualización.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    { version: process.env.NEXT_PUBLIC_APP_VERSION },
    { headers: { "Cache-Control": "no-store" } },
  );
}
