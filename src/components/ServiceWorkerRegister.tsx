"use client";

import { useEffect } from "react";

/**
 * Registra el service worker (solo en producción para evitar problemas de
 * cache durante el desarrollo). Se monta una vez desde el layout.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV === "production" &&
      "serviceWorker" in navigator
    ) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("Fallo al registrar el service worker:", err);
      });
    }
  }, []);

  return null;
}
