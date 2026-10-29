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
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { PageHeader } from "@/components/PageHeader";
import { Icon } from "@/components/Icon";
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
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-5 py-6">
      <PageHeader
        title="Recurrentes"
        subtitle="Lo que se repite: tocá Registrar y listo"
        action={<GeneratePendingButton />}
      />

      <details className="card group overflow-hidden" open={list.length === 0}>
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 font-semibold [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"><Icon name="plus" size={16} /></span>
            Nuevo recurrente
          </span>
          <Icon name="chevronDown" className="text-black/40 transition-transform group-open:rotate-180 dark:text-white/40" />
        </summary>
        <div className="px-5 pb-5">
          <RecurringForm
            categories={categories ?? []}
            baseCurrency={base}
            currencies={currencies}
          />
        </div>
      </details>

      <section className="flex flex-col gap-2.5">
        <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-black/45 dark:text-white/45">
          Tus recurrentes
        </h2>
        {list.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 px-6 py-8 text-center">
            <span className="text-3xl">🔁</span>
            <p className="text-sm text-black/55 dark:text-white/55">
              Agregá el salario, el alquiler o el pase de bus y registralos con un toque.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {list.map((t) => (
              <li
                key={t.id}
                className={`card flex flex-col gap-3 p-4 ${t.is_active ? "" : "opacity-55"}`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl"
                    style={{
                      backgroundColor:
                        (t.categories?.color ?? "#94a3b8") + "22",
                    }}
                  >
                    {categoryIcon(t.categories?.icon)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{t.name}</p>
                    <p className="truncate text-xs text-black/45 dark:text-white/45">
                      {freqText(t)}
                      {!t.is_active ? " · pausada" : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 font-semibold ${
                      t.kind === "income" ? "text-emerald-600 dark:text-emerald-400" : ""
                    }`}
                  >
                    {t.kind === "income" ? "+" : "−"}
                    {formatMoney(t.amount, t.currency)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <form action={quickAddFromTemplate} className="flex-1">
                    <input type="hidden" name="template_id" value={t.id} />
                    <SubmitButton
                      pendingLabel="Registrando…"
                      doneToast={`${t.name} registrado`}
                      className="w-full rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      Registrar hoy
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
                      className="rounded-xl bg-black/[0.05] px-3 py-2 text-sm font-medium text-black/65 dark:bg-white/[0.07] dark:text-white/70"
                    >
                      <Icon name={t.is_active ? "pause" : "play"} size={16} />
                    </SubmitButton>
                  </form>
                  <Link
                    href={`/dashboard/recurring/${t.id}`}
                    aria-label="Editar recurrente"
                    title="Editar"
                    className="rounded-xl bg-black/[0.05] px-3 py-2 text-sm font-medium text-black/65 dark:bg-white/[0.07] dark:text-white/70"
                  >
                    <Icon name="edit" size={16} />
                  </Link>
                  <form action={deleteRecurring}>
                    <input type="hidden" name="id" value={t.id} />
                    <ConfirmSubmitButton
                      aria-label="Borrar recurrente"
                      confirmLabel="¿Borrar?"
                      className="rounded-xl bg-black/[0.05] px-3 py-2 text-sm text-black/50 dark:bg-white/[0.07] dark:text-white/55"
                      confirmClassName="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white"
                    >
                      <Icon name="trash" size={16} />
                    </ConfirmSubmitButton>
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
