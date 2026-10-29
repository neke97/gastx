import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../actions";
import { SubmitButton } from "@/components/SubmitButton";
import { InstallAppButton } from "@/components/InstallAppButton";
import { PageHeader } from "@/components/PageHeader";

const LINKS = [
  { href: "/dashboard/categories", label: "Categorías", hint: "Íconos y colores de tus gastos", icon: "🏷️", tint: "#f59e0b" },
  { href: "/dashboard/people", label: "Personas", hint: "Con quién dividís gastos", icon: "🙋", tint: "#3b82f6" },
  { href: "/dashboard/groups", label: "Grupos", hint: "Gastos compartidos con otros", icon: "👥", tint: "#8b5cf6" },
  { href: "/dashboard/settings", label: "Ajustes", hint: "Moneda base y tipos de cambio", icon: "⚙️", tint: "#64748b" },
];

export default async function MorePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();
  const rawName =
    (profile?.display_name as string | null)?.trim() ||
    (user.email ?? "").split("@")[0];
  const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-5 py-6">
      <PageHeader title="Más" />

      <section className="card flex items-center gap-4 p-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-2xl font-bold text-white shadow-md shadow-emerald-600/25">
          {name.charAt(0)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{name}</p>
          <p className="truncate text-sm text-black/50 dark:text-white/50">{user.email}</p>
        </div>
      </section>

      <ul className="card flex flex-col divide-y divide-black/[0.05] overflow-hidden dark:divide-white/[0.06]">
        {LINKS.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-black/[0.02] active:!scale-100 active:bg-black/[0.04] dark:hover:bg-white/[0.03]"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                style={{ backgroundColor: l.tint + "22" }}
              >
                {l.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium">{l.label}</span>
                <span className="block truncate text-xs text-black/45 dark:text-white/45">{l.hint}</span>
              </span>
              <span className="text-black/25 dark:text-white/25" aria-hidden>
                ›
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <InstallAppButton />

      <form action={signOut}>
        <SubmitButton
          pendingLabel="Saliendo…"
          className="w-full rounded-2xl px-4 py-3 text-sm font-medium text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
        >
          Cerrar sesión
        </SubmitButton>
      </form>

      <p className="text-center text-xs text-black/35 dark:text-white/35">
        GastX · hecho con 💚 en Costa Rica
      </p>
    </main>
  );
}
