"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const noopSubscribe = () => () => {};
import { TransactionForm } from "@/components/TransactionForm";

type FormProps = Omit<React.ComponentProps<typeof TransactionForm>, "onSaved" | "initial">;

const OPEN_EVENT = "gastx:add";

/** Abre la hoja de "Nuevo movimiento" desde cualquier botón (ej. estado vacío). */
export function openAddSheet() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

/** Botón que abre la hoja; para usar dentro de Server Components. */
export function AddTransactionButton({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button type="button" onClick={openAddSheet} className={className}>
      {children}
    </button>
  );
}

/**
 * Botón flotante "+" que abre una hoja inferior con el formulario para
 * registrar un gasto o ingreso. Al guardar, la hoja se cierra sola.
 */
export function AddTransactionSheet(props: FormProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  // Bloquear el scroll de fondo y cerrar con Escape mientras está abierta.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Se monta en <body>: un ancestro con animación (transform) atraparía los
  // elementos `fixed` y el botón no quedaría flotando sobre la pantalla.
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  if (!mounted) return null;

  return createPortal(
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Agregar movimiento"
        className="fixed right-5 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-700/30 hover:bg-emerald-700"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 80px)" }}
      >
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label="Nuevo movimiento">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setOpen(false)}
            className="backdrop-in absolute inset-0 cursor-default bg-black/40 backdrop-blur-[2px] active:!scale-100"
          />
          <div
            className="sheet-up relative max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-[var(--card)] px-5 pb-6 pt-3 shadow-2xl"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)" }}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-black/15 dark:bg-white/20" />
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-tight">Nuevo movimiento</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.05] text-black/60 dark:bg-white/10 dark:text-white/70"
              >
                ✕
              </button>
            </div>
            <TransactionForm {...props} onSaved={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>,
    document.body,
  );
}
