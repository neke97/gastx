"use client";

import { useEffect, useState } from "react";

type Toast = { id: number; message: string; tone: "success" | "error" };

const EVENT = "gastx:toast";

/**
 * Muestra un aviso flotante breve (ej. "Gasto agregado ✓") y da una vibración
 * corta en el celular. Se puede llamar desde cualquier componente cliente.
 */
export function toast(message: string, tone: Toast["tone"] = "success") {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { message, tone } }));
  try {
    navigator.vibrate?.(tone === "success" ? 12 : [20, 60, 20]);
  } catch {
    // Sin vibración disponible: no pasa nada.
  }
}

/** Contenedor de avisos; se monta una vez en el layout de la app. */
export function Toaster() {
  const [current, setCurrent] = useState<Toast | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const onToast = (e: Event) => {
      const { message, tone } = (e as CustomEvent<Omit<Toast, "id">>).detail;
      setCurrent({ id: Date.now(), message, tone });
      clearTimeout(timer);
      timer = setTimeout(() => setCurrent(null), 2400);
    };
    window.addEventListener(EVENT, onToast);
    return () => {
      window.removeEventListener(EVENT, onToast);
      clearTimeout(timer);
    };
  }, []);

  if (!current) return null;

  return (
    <div
      key={current.id}
      role="alert"
      aria-live="polite"
      className={`toast-in fixed left-1/2 z-[60] flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-white shadow-lg ${
        current.tone === "success" ? "bg-neutral-900 dark:bg-neutral-800" : "bg-red-600"
      }`}
      style={{ top: "calc(env(safe-area-inset-top) + 50px)" }}
    >
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
          current.tone === "success" ? "bg-emerald-500" : "bg-white/25"
        }`}
        aria-hidden
      >
        {current.tone === "success" ? "✓" : "!"}
      </span>
      {current.message}
    </div>
  );
}
