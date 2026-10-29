"use client";

import { useEffect } from "react";

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION;

/**
 * Registra el service worker (solo en producción para evitar problemas de
 * cache durante el desarrollo) y mantiene la app actualizada sola:
 *
 * - El SW se registra con `?v=<versión>`, así cada deploy instala un SW nuevo
 *   (y limpia el cache viejo).
 * - Al abrir la app o volver a ella, compara su versión con /api/version; si
 *   hay una más nueva, recarga. Se hace al volver (no con la app en uso) para
 *   no perder lo que se esté escribiendo.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker
      .register(`/sw.js?v=${APP_VERSION}`)
      .catch((err) => console.error("Fallo al registrar el service worker:", err));

    let reloading = false;
    async function checkForUpdate() {
      if (reloading || document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        if (!res.ok) return;
        const { version } = (await res.json()) as { version?: string };
        if (version && version !== APP_VERSION) {
          reloading = true;
          const reg = await navigator.serviceWorker.getRegistration();
          await reg?.update().catch(() => {});
          window.location.reload();
        }
      } catch {
        // Sin conexión: se reintenta la próxima vez.
      }
    }

    checkForUpdate();
    document.addEventListener("visibilitychange", checkForUpdate);
    return () => document.removeEventListener("visibilitychange", checkForUpdate);
  }, []);

  return null;
}
