import Link from "next/link";

/**
 * Encabezado uniforme de pantalla. Las pestañas principales van sin "atrás";
 * las subpantallas pasan `back` y muestran una flecha redonda.
 */
export function PageHeader({
  title,
  subtitle,
  back,
  action,
}: {
  title: string;
  subtitle?: React.ReactNode;
  back?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        {back && (
          <Link
            href={back}
            aria-label="Volver"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--card)] shadow-sm ring-1 ring-black/[0.06] dark:ring-white/10"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
        )}
        <div className="min-w-0">
          <h1 className={`truncate font-bold tracking-tight ${back ? "text-xl" : "text-2xl"}`}>
            {title}
          </h1>
          {subtitle && (
            <p className="truncate text-sm text-black/50 dark:text-white/50">{subtitle}</p>
          )}
        </div>
      </div>
      {action}
    </header>
  );
}
