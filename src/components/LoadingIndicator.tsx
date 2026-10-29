"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Spinner } from "@/components/Spinner";

/** Tiempo mínimo visible, para que el indicador no sea un parpadeo imperceptible. */
const MIN_VISIBLE_MS = 350;
/** Por seguridad: si algo nunca termina, el indicador se apaga solo. */
const MAX_VISIBLE_MS = 20_000;

const currentKey = () => `${location.pathname}?${location.search.replace(/^\?/, "")}`;

/**
 * Indicador global de "Cargando…" (barrita arriba + pastilla) que aparece en
 * cada toque que va a la base de datos:
 *
 * - Navegar: tocar un enlace interno, enviar un filtro GET o ir atrás/adelante.
 *   Termina solo cuando cambia la URL (la pantalla nueva ya llegó).
 * - Guardar/borrar (server actions): mientras haya un botón con
 *   aria-busy="true" (SubmitButton y los formularios lo ponen al esperar).
 */
export function LoadingIndicator() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlKey = `${pathname}?${searchParams.toString()}`;

  // URL desde la que se empezó a navegar; "navegando" mientras siga siendo la actual.
  const [navFrom, setNavFrom] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState(false);
  // Mantiene el indicador un ratito tras terminar (mínimo visible).
  const [lingering, setLingering] = useState(false);
  const shownAt = useRef(0);

  const navigating = navFrom !== null && navFrom === urlKey;
  const active = navigating || busyAction;

  useEffect(() => {
    const begin = () => {
      shownAt.current = Date.now();
      setLingering(true);
    };
    const startNav = () => {
      begin();
      setNavFrom(currentKey());
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || !a.href || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      // Mismo destino (o solo un #ancla): no hay nada que cargar.
      if (url.pathname === location.pathname && url.search === location.search) return;
      startNav();
    };
    const onSubmit = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement;
      if (!e.defaultPrevented && form.method?.toLowerCase() === "get") startNav();
    };
    // Guardar/borrar: botones que pasan a aria-busy="true".
    const observer = new MutationObserver(() => {
      const busy = Boolean(document.querySelector('button[aria-busy="true"]'));
      if (busy) begin();
      setBusyAction(busy);
    });
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["aria-busy"],
    });

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    window.addEventListener("popstate", startNav);
    return () => {
      observer.disconnect();
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      window.removeEventListener("popstate", startNav);
    };
  }, []);

  // Al terminar, esperar lo que falte del mínimo visible; mientras dure, tope de seguridad.
  useEffect(() => {
    if (active) {
      const safety = setTimeout(() => {
        setNavFrom(null);
        setBusyAction(false);
        setLingering(false);
      }, MAX_VISIBLE_MS);
      return () => clearTimeout(safety);
    }
    const wait = Math.max(0, MIN_VISIBLE_MS - (Date.now() - shownAt.current));
    const t = setTimeout(() => setLingering(false), wait);
    return () => clearTimeout(t);
  }, [active]);

  if (!active && !lingering) return null;

  return (
    <>
      <div
        aria-hidden
        className="fixed inset-x-0 top-0 z-[70] h-[3px] overflow-hidden bg-emerald-500/20"
      >
        <div className="loading-bar h-full w-1/3 rounded-full bg-emerald-500" />
      </div>
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2 rounded-full bg-neutral-900/90 px-3.5 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur dark:bg-neutral-800/90"
        style={{ top: "calc(env(safe-area-inset-top) + 10px)" }}
      >
        <Spinner size={13} className="text-emerald-400" />
        Cargando…
      </div>
    </>
  );
}
