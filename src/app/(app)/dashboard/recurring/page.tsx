import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RecurringForm } from "@/components/RecurringForm";
import { GeneratePendingButton } from "@/components/GeneratePendingButton";
import {
  toggleActiveRecurring,
  deleteRecurring,
  quickAddFromTemplate,
} from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { formatMoney, formatDate } from "@/lib/format";
import { buildRateMap, availableCurrencies } from "@/lib/currency";
import { categoryIcon } from "@/lib/categoryIcons";

type Template = {
  id: string;
  kind: "expense" | "income";
  name: string;
  amount: number;
  currency: string;
  frequency: "daily" | "weekly" | "monthly" | "yearly" | null;
  interval: number;
  next_run_on: string | null;
  is_active: boolean;
  categories: { icon: string | null; color: string | null } | null;
};

const FREQ_LABELS: Record<string, string> = {
  daily: "diario",
  weekly: "semanal",
  monthly: "mensual",
  yearly: "anual",
};

function freqText(t: Template) {
  if (!t.frequency) return "Atajo (sin repetir)";
  const base = FREQ_LABELS[t.frequency];
  const freq = t.interval > 1 ? `cada ${t.interval} (${base})` : base;
  return t.next_run_on ? `${freq} · próxima ${formatDate(t.next_run_on)}` : freq;
}

export default async function RecurringPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: categories }, { data: templates }, { data: profile }, { data: rates }] =
    await Promise.all([
      supabase
        .from("categories")
        .select("id, name, kind, icon")
        .eq("is_archived", false)
        .order("name"),
      supabase
        .from("recurring_templates")
        .select(
          "id, kind, name, amount, currency, frequency, interval, next_run_on, is_active, categories(icon, color)",
        )
        .order("is_active", { ascending: false })
        .order("next_run_on", { nullsFirst: false }),
      supabase.from("profiles").select("default_currency").eq("id", user.id).maybeSingle(),
      supabase.from("exchange_rates").select("code, rate_to_base"),
    ]);

  const base = profile?.default_currency ?? "CRC";
  const currencies = availableCurrencies(base, buildRateMap(rates));

  const list = (templates ?? []) as unknown as Template[];

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-5 py-8">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-sm text-black/60 hover:underline dark:text-white/60"
          >
            ← Volver
          </Link>
          <h1 className="text-xl font-bold tracking-tight">Recurrentes</h1>
        </div>
        <GeneratePendingButton />
      </header>

      <p className="text-sm text-black/60 dark:text-white/60">
        Tu lista de gastos/ingresos frecuentes (ej. &quot;Bus de Ipis&quot;). Tocá{" "}
        <span className="font-medium text-emerald-700 dark:text-emerald-400">
          Registrar
        </span>{" "}
        para sumarlo hoy. La generación automática (según la frecuencia) es opcional.
      </p>

      <RecurringForm
        categories={categories ?? []}
        baseCurrency={base}
        currencies={currencies}
      />

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-black/70 dark:text-white/70">
          Tus recurrentes
        </h2>
        {list.length === 0 ? (
          <p className="rounded-xl border border-black/10 bg-black/[0.02] px-4 py-6 text-center text-sm text-black/50 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/50">
            Todavía no tenés recurrentes.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-black/5 overflow-hidden rounded-xl border border-black/10 dark:divide-white/5 dark:border-white/10">
            {list.map((t) => (
              <li
                key={t.id}
                className={`flex items-center justify-between gap-3 px-4 py-3 ${t.is_active ? "" : "opacity-50"}`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg"
                    style={{
                      backgroundColor:
                        (t.categories?.color ?? "#94a3b8") + "22",
                    }}
                  >
                    {categoryIcon(t.categories?.icon)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      <span
                        className={
                          t.kind === "income"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                        }
                      >
                        {t.kind === "income" ? "+" : "−"}
                        {formatMoney(t.amount, t.currency)}
                      </span>{" "}
                      · {t.name}
                    </p>
                    <p className="text-xs text-black/50 dark:text-white/50">
                      {freqText(t)}
                      {!t.is_active ? " · pausada" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <form action={quickAddFromTemplate}>
                    <input type="hidden" name="template_id" value={t.id} />
                    <SubmitButton
                      pendingLabel="…"
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
                    >
                      Registrar
                    </SubmitButton>
                  </form>
                  <form action={toggleActiveRecurring}>
                    <input type="hidden" name="id" value={t.id} />
                    <input
                      type="hidden"
                      name="active"
                      value={t.is_active ? "false" : "true"}
                    />
                    <SubmitButton
                      title={t.is_active ? "Pausar" : "Activar"}
                      pendingLabel="…"
                      className="rounded-md px-2 py-1 text-xs text-black/50 transition-colors hover:bg-black/[0.06] dark:text-white/50 dark:hover:bg-white/10"
                    >
                      {t.is_active ? "Pausar" : "Activar"}
                    </SubmitButton>
                  </form>
                  <Link
                    href={`/dashboard/recurring/${t.id}`}
                    aria-label="Editar recurrente"
                    title="Editar"
                    className="rounded-md px-2 py-1 text-black/30 transition-colors hover:bg-black/[0.06] hover:text-black/70 dark:text-white/30 dark:hover:bg-white/10 dark:hover:text-white/80"
                  >
                    ✎
                  </Link>
                  <form action={deleteRecurring}>
                    <input type="hidden" name="id" value={t.id} />
                    <SubmitButton
                      aria-label="Borrar recurrente"
                      title="Borrar"
                      className="rounded-md px-2 py-1 text-black/30 transition-colors hover:bg-red-500/10 hover:text-red-600 dark:text-white/30 dark:hover:text-red-400"
                    >
                      ✕
                    </SubmitButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
