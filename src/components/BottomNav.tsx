"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard", label: "Inicio", icon: "🏠", exact: true },
  { href: "/dashboard/reports", label: "Reportes", icon: "📊" },
  { href: "/dashboard/recurring", label: "Recurrentes", icon: "🔁" },
  { href: "/dashboard/installments", label: "Cuotas", icon: "💳" },
  { href: "/dashboard/more", label: "Más", icon: "⚙️" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-neutral-900/90"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-xl">
        {TABS.map((t) => {
          const active = t.exact
            ? pathname === t.href
            : pathname.startsWith(t.href);
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                className={`flex flex-col items-center gap-0.5 py-2 text-[11px] transition-colors ${
                  active
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-black/50 hover:text-black/80 dark:text-white/50 dark:hover:text-white/80"
                }`}
              >
                <span className="text-lg leading-none">{t.icon}</span>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
