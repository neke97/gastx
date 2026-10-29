"use client";

import { useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "@/components/Toaster";

/**
 * Botón de submit que muestra estado de carga usando useFormStatus.
 * Debe ir DENTRO de un <form action={serverAction}>. Se deshabilita mientras
 * la acción está pendiente y (opcional) cambia el texto a `pendingLabel`.
 * Con `doneToast`, al terminar muestra ese aviso (ej. "Registrado ✓").
 */
export function SubmitButton({
  children,
  className = "",
  pendingLabel,
  title,
  doneToast,
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode;
  className?: string;
  pendingLabel?: React.ReactNode;
  title?: string;
  doneToast?: string;
  "aria-label"?: string;
}) {
  const { pending } = useFormStatus();
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && doneToast) toast(doneToast);
    wasPending.current = pending;
  }, [pending, doneToast]);

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      title={title}
      aria-label={ariaLabel}
      className={`${className} ${pending ? "opacity-60" : ""}`}
    >
      {pending ? (pendingLabel ?? "…") : children}
    </button>
  );
}
