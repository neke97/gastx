"use client";

import { useFormStatus } from "react-dom";

/**
 * Botón de submit que muestra estado de carga usando useFormStatus.
 * Debe ir DENTRO de un <form action={serverAction}>. Se deshabilita mientras
 * la acción está pendiente y (opcional) cambia el texto a `pendingLabel`.
 */
export function SubmitButton({
  children,
  className = "",
  pendingLabel,
  title,
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode;
  className?: string;
  pendingLabel?: React.ReactNode;
  title?: string;
  "aria-label"?: string;
}) {
  const { pending } = useFormStatus();

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
