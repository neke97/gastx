import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../actions";
import { SubmitButton } from "@/components/SubmitButton";

const LINKS = [
  { href: "/dashboard/categories", label: "Categorías", icon: "🏷️" },
  { href: "/dashboard/people", label: "Personas", icon: "👥" },
];

export default async function MorePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-5 py-8">
      <header>
        <h1 className="text-xl font-bold tracking-tight">Más</h1>
        <p className="text-sm text-black/60 dark:text-white/60">{user.email}</p>
      </header>

      <ul className="flex flex-col divide-y divide-black/5 overflow-hidden rounded-xl border border-black/10 dark:divide-white/5 dark:border-white/10">
        {LINKS.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="flex items-center gap-3 px-4 py-3.5 text-sm transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
            >
              <span className="text-lg">{l.icon}</span>
              {l.label}
              <span className="ml-auto text-black/30 dark:text-white/30">›</span>
            </Link>
          </li>
        ))}
      </ul>

      <form action={signOut}>
        <SubmitButton
          pendingLabel="Saliendo…"
          className="w-full rounded-lg border border-black/15 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-black/[0.04] dark:border-white/15 dark:hover:bg-white/[0.06]"
        >
          Cerrar sesión
        </SubmitButton>
      </form>
    </main>
  );
}
