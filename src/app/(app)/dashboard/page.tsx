import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteTransaction } from "./actions";
import { quickAddFromTemplate } from "./recurring/actions";
import { TransactionForm } from "@/components/TransactionForm";
import { SubmitButton } from "@/components/SubmitButton";
import { formatMoney, formatDate, formatTime } from "@/lib/format";
import {
  buildRateMap,
  toBase,
  availableCurrencies,
  canConvert,
} from "@/lib/currency";
import { categoryIcon } from "@/lib/categoryIcons";

type Shortcut = {
  id: string;
  name: string;
  amount: number;
  currency: string;
  kind: "expense" | "income";
};

type TxRow = {
  id: string;
  kind: "expense" | "income";
  amount: number;
  currency: string;
  description: string | null;
  occurred_on: string;
  occurred_at: string | null;
  categories: { name: string; icon: string | null; color: string | null } | null;
  transaction_splits: {
    amount_resolved: number;
    people: { name: string } | null;
  }[];
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function ymd(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; period?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { filter, period } = await searchParams;
  const listFilter =
    filter === "income" || filter === "expense" ? filter : "all";

  const now = new Date();
  const currentYM = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
  const currentYear = now.getFullYear();

  // Período del balance: "all" (general, hasta hoy), "YYYY" (año) o "YYYY-MM" (mes).
  const p = period ?? "all";
  let periodStart: string | null = null; // null = sin límite inferior (todo)
  let periodEnd: string; // límite superior exclusivo
  let periodKind: "all" | "year" | "month";
  let periodLabel: string;

  if (/^\d{4}-\d{2}$/.test(p)) {
    periodKind = "month";
    const [y, m] = p.split("-").map(Number);
    periodStart = `${p}-01`;
    periodEnd = ymd(new Date(y, m, 1));
    periodLabel = new Intl.DateTimeFormat("es-CR", {
      month: "long",
      year: "numeric",
    }).format(new Date(y, m - 1, 1));
  } else if (/^\d{4}$/.test(p)) {
    periodKind = "year";
    const y = Number(p);
    periodStart = `${y}-01-01`;
    periodEnd = `${y + 1}-01-01`;
    periodLabel = String(y);
  } else {
    periodKind = "all";
    periodStart = null;
    // "Hasta hoy": excluir fechas futuras (ej. recurrentes por generar).
    periodEnd = ymd(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
    periodLabel = "General";
  }

  // Enlaces que preservan el filtro de lista y el período entre sí.
  const mkHref = (next: { filter?: string; period?: string }) => {
    const sp = new URLSearchParams();
    const f = "filter" in next ? next.filter : listFilter !== "all" ? listFilter : undefined;
    const pr = "period" in next ? next.period : periodKind !== "all" ? p : undefined;
    if (f) sp.set("filter", f);
    if (pr) sp.set("period", pr);
    const qs = sp.toString();
    return qs ? `/dashboard?${qs}` : "/dashboard";
  };

  // Balance del período seleccionado.
  let periodQuery = supabase
    .from("transactions")
    .select("kind, amount, currency")
    .is("group_id", null)
    .lt("occurred_on", periodEnd);
  if (periodStart) periodQuery = periodQuery.gte("occurred_on", periodStart);

  // Lista de últimos movimientos, con filtro opcional por tipo.
  let txQuery = supabase
    .from("transactions")
    .select(
      "id, kind, amount, currency, description, occurred_on, occurred_at, categories(name, icon, color), transaction_splits(amount_resolved, people(name))",
    )
    .is("group_id", null);
  if (listFilter !== "all") txQuery = txQuery.eq("kind", listFilter);
  txQuery = txQuery
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(30);

  const [
    { data: profile },
    { data: rates },
    { data: categories },
    { data: people },
    { data: shortcuts },
    { data: transactions },
    { data: periodRows },
  ] = await Promise.all([
    supabase.from("profiles").select("default_currency").eq("id", user.id).maybeSingle(),
    supabase.from("exchange_rates").select("code, rate_to_base"),
    supabase
      .from("categories")
      .select("id, name, kind, icon")
      .eq("is_archived", false)
      .order("name"),
    supabase.from("people").select("id, name").order("name"),
    supabase
      .from("recurring_templates")
      .select("id, name, amount, currency, kind")
      .eq("is_active", true)
      .order("name"),
    txQuery,
    periodQuery,
  ]);

  const txs = (transactions ?? []) as unknown as TxRow[];
  const quickShortcuts = (shortcuts ?? []) as Shortcut[];

  const base = profile?.default_currency ?? "CRC";
  const rateMap = buildRateMap(rates);
  const currencies = availableCurrencies(base, rateMap);

  // Solo sumamos lo convertible; lo que no tenga tasa se avisa aparte (no se
  // cuenta como 1:1, que descuadraría el total).
  const convertible = (periodRows ?? []).filter((r) =>
    canConvert(r.currency, base, rateMap),
  );
  const income = convertible
    .filter((r) => r.kind === "income")
    .reduce((sum, r) => sum + toBase(Number(r.amount), r.currency, base, rateMap), 0);
  const expense = convertible
    .filter((r) => r.kind === "expense")
    .reduce((sum, r) => sum + toBase(Number(r.amount), r.currency, base, rateMap), 0);
  const balance = income - expense;

  const missingCurrencies = [
    ...new Set(
      (periodRows ?? [])
        .filter((r) => !canConvert(r.currency, base, rateMap))
        .map((r) => r.currency),
    ),
  ];

  // Años para el selector (actual y 5 hacia atrás).
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-5 py-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Hola 👋</h1>
        <p className="text-sm text-black/60 dark:text-white/60">{user.email}</p>
      </header>

      <section className="rounded-2xl border border-black/10 bg-gradient-to-br from-emerald-500/10 to-transparent p-5 dark:border-white/10">
        {/* Selector de período */}
        <div className="mb-4 flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            {(
              [
                { key: "all", label: "General", period: undefined },
                { key: "month", label: "Este mes", period: currentYM },
                { key: "year", label: "Este año", period: String(currentYear) },
              ] as const
            ).map((opt) => {
              const active =
                opt.key === "all"
                  ? periodKind === "all"
                  : opt.period === p;
              return (
                <Link
                  key={opt.key}
                  href={mkHref({ period: opt.period })}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    active
                      ? "bg-emerald-600 text-white"
                      : "border border-black/15 dark:border-white/15"
                  }`}
                >
                  {opt.label}
                </Link>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <form method="get" className="flex items-center gap-1">
              {listFilter !== "all" && (
                <input type="hidden" name="filter" value={listFilter} />
              )}
              <input
                type="month"
                name="period"
                defaultValue={periodKind === "month" ? p : currentYM}
                max={currentYM}
                aria-label="Ver un mes específico"
                className="rounded-lg border border-black/15 bg-white px-2 py-1 text-black outline-none focus:border-emerald-500 dark:border-white/15 dark:bg-neutral-900 dark:text-white"
              />
              <button
                type="submit"
                className="rounded-lg border border-black/15 px-2.5 py-1 font-medium transition-colors hover:bg-black/[0.06] dark:border-white/15 dark:hover:bg-white/10"
              >
                Ver mes
              </button>
            </form>
            <form method="get" className="flex items-center gap-1">
              {listFilter !== "all" && (
                <input type="hidden" name="filter" value={listFilter} />
              )}
              <select
                name="period"
                defaultValue={periodKind === "year" ? p : String(currentYear)}
                aria-label="Ver un año específico"
                className="rounded-lg border border-black/15 bg-white px-2 py-1 text-black outline-none focus:border-emerald-500 dark:border-white/15 dark:bg-neutral-900 dark:text-white"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-lg border border-black/15 px-2.5 py-1 font-medium transition-colors hover:bg-black/[0.06] dark:border-white/15 dark:hover:bg-white/10"
              >
                Ver año
              </button>
            </form>
          </div>
        </div>

        <p className="text-xs font-medium uppercase tracking-wide text-black/50 dark:text-white/50">
          {periodKind === "all" ? "Balance general" : `Balance de ${periodLabel}`}
        </p>
        <p
          className={`mt-1 text-3xl font-bold tracking-tight ${
            balance >= 0
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {formatMoney(balance, base)}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-black/[0.03] px-3 py-2 dark:bg-white/[0.04]">
            <p className="text-black/50 dark:text-white/50">Ingresos</p>
            <p className="font-semibold text-emerald-600 dark:text-emerald-400">
              {formatMoney(income, base)}
            </p>
          </div>
          <div className="rounded-xl bg-black/[0.03] px-3 py-2 dark:bg-white/[0.04]">
            <p className="text-black/50 dark:text-white/50">Gastos</p>
            <p className="font-semibold text-red-600 dark:text-red-400">
              {formatMoney(expense, base)}
            </p>
          </div>
        </div>
        {missingCurrencies.length > 0 && (
          <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
            ⚠️ No se incluyen movimientos en {missingCurrencies.join(", ")}: falta
            su tipo de cambio.{" "}
            <Link href="/dashboard/settings" className="underline">
              Agregalo en Ajustes
            </Link>
            .
          </p>
        )}
      </section>

      {quickShortcuts.length > 0 && (
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-black/70 dark:text-white/70">
              Atajos — tocá para registrar
            </h2>
            <Link
              href="/dashboard/recurring"
              className="text-xs text-emerald-600 hover:underline dark:text-emerald-400"
            >
              Gestionar
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickShortcuts.map((s) => (
              <form key={s.id} action={quickAddFromTemplate}>
                <input type="hidden" name="template_id" value={s.id} />
                <SubmitButton
                  pendingLabel="Agregando…"
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    s.kind === "income"
                      ? "border-emerald-600/40 text-emerald-700 hover:bg-emerald-600/10 dark:text-emerald-400"
                      : "border-black/15 hover:bg-black/[0.04] dark:border-white/15 dark:hover:bg-white/[0.06]"
                  }`}
                >
                  {s.name} · {s.kind === "income" ? "+" : "−"}
                  {formatMoney(s.amount, s.currency)}
                </SubmitButton>
              </form>
            ))}
          </div>
        </section>
      )}

      <TransactionForm
        categories={categories ?? []}
        people={people ?? []}
        baseCurrency={base}
        currencies={currencies}
      />

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-black/70 dark:text-white/70">
          Últimos movimientos
        </h2>

        <div className="flex gap-2">
          {(
            [
              { key: "all", label: "Todos", active: "bg-blue-600 text-white" },
              {
                key: "income",
                label: "Ingresos",
                active: "bg-emerald-600 text-white",
              },
              {
                key: "expense",
                label: "Gastos",
                active: "bg-red-600 text-white",
              },
            ] as const
          ).map((f) => (
            <Link
              key={f.key}
              href={mkHref({ filter: f.key === "all" ? undefined : f.key })}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                listFilter === f.key
                  ? f.active
                  : "border border-black/15 dark:border-white/15"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>

        {txs.length === 0 ? (
          <p className="rounded-xl border border-black/10 bg-black/[0.02] px-4 py-6 text-center text-sm text-black/50 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/50">
            Todavía no hay movimientos. ¡Agregá el primero arriba!
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-black/5 overflow-hidden rounded-xl border border-black/10 dark:divide-white/5 dark:border-white/10">
            {txs.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
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
                    {t.description || t.categories?.name || "Movimiento"}
                  </p>
                  <p className="text-xs text-black/50 dark:text-white/50">
                    {t.categories?.name ? `${t.categories.name} · ` : ""}
                    {formatDate(t.occurred_on)}
                    {t.occurred_at ? ` · ${formatTime(t.occurred_at)}` : ""}
                  </p>
                  {t.transaction_splits.length > 0 && (
                    <p className="mt-0.5 truncate text-xs text-emerald-700/80 dark:text-emerald-400/80">
                      Dividido:{" "}
                      {t.transaction_splits
                        .map(
                          (s) =>
                            `${s.people?.name ?? "?"} ${formatMoney(s.amount_resolved, t.currency)}`,
                        )
                        .join(" · ")}
                    </p>
                  )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className={`text-sm font-semibold ${
                      t.kind === "income"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {t.kind === "income" ? "+" : "−"}
                    {formatMoney(t.amount, t.currency)}
                  </span>
                  <Link
                    href={`/dashboard/${t.id}`}
                    aria-label="Editar movimiento"
                    title="Editar"
                    className="rounded-md px-2 py-1 text-black/30 transition-colors hover:bg-black/[0.06] hover:text-black/70 dark:text-white/30 dark:hover:bg-white/10 dark:hover:text-white/80"
                  >
                    ✎
                  </Link>
                  <form action={deleteTransaction}>
                    <input type="hidden" name="id" value={t.id} />
                    <SubmitButton
                      aria-label="Borrar movimiento"
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
