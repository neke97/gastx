/** Ruedita de carga; toma el color del texto donde se use. */
export function Spinner({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

/** Contenido estándar de un botón mientras espera: ruedita + texto. */
export function Busy({ label = "Cargando…" }: { label?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center justify-center gap-2">
      <Spinner />
      {label}
    </span>
  );
}
