"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

/**
 * Botón de borrar en dos toques: el primero pide confirmación ("¿Borrar?") y
 * el segundo envía el formulario. Si no se confirma en 3 s, vuelve a su estado.
 * Evita borrar algo por un toque accidental. Va DENTRO de un <form action>.
 */
export function ConfirmSubmitButton({
  children,
  confirmLabel = "¿Borrar? Tocá de nuevo",
  className = "",
  confirmClassName = "",
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode;
  confirmLabel?: React.ReactNode;
  className?: string;
  confirmClassName?: string;
  "aria-label"?: string;
}) {
  const { pending } = useFormStatus();
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);

  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={armed ? "Confirmar borrado" : ariaLabel}
      onClick={(e) => {
        if (!armed) {
          e.preventDefault();
          setArmed(true);
          try {
            navigator.vibrate?.(8);
          } catch {}
        }
      }}
      className={armed ? confirmClassName : className}
    >
      {pending ? "Borrando…" : armed ? confirmLabel : children}
    </button>
  );
}
