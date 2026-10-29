import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { quickAddFromTemplate } from "./recurring/actions";
import {
  AddTransactionSheet,
  AddTransactionButton,
} from "@/components/AddTransactionSheet";
import { SubmitButton } from "@/components/SubmitButton";
import { Icon } from "@/components/Icon";
import {
  formatMoney,
  formatTime,
  formatDayLabel,
  todayCR,
  greetingCR,
} from "@/lib/format";
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
    supabase
      .from("profiles")
      .select("default_currency, display_name")
      .eq("id", user.id)
      .maybeSingle(),
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

  // Nombre para el saludo: el del perfil o la parte del correo antes de la @.
  const rawName =
    (profile?.display_name as string | null)?.trim() ||
    (user.email ?? "").split("@")[0].split(/[._-]/)[0];
  const firstName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  // Movimientos agrupados por día (ya vienen ordenados del más reciente).
  const today = todayCR();
  const days: { day: string; items: TxRow[]; net: number }[] = [];
  for (const t of txs) {
    let g = days[days.length - 1];
    if (!g || g.day !== t.occurred_on) {
      g = { day: t.occurred_on, items: [], net: 0 };
      days.push(g);
    }
    g.items.push(t);
    if (canConvert(t.currency, base, rateMap)) {
      const v = toBase(Number(t.amount), t.currency, base, rateMap);
      g.net += t.kind === "income" ? v : -v;
    }
  }

  const periodTabs = [
    { key: "all", label: "General", period: undefined },
    { key: "month", label: "Este mes", period: currentYM },
    { key: "year", label: "Este año", period: String(currentYear) },
  ] as const;
  const customPeriod =
    periodKind !== "all" && p !== currentYM && p !== String(currentYear);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-5 pb-8 pt-6">
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-black/50 dark:text-white/50">{greetingCR()},</p>
          <h1 className="truncate text-2xl font-bold tracking-tight">{firstName} 👋</h1>
        </div>
        <Link
          href="/dashboard/more"
          aria-label="Mi cuenta"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-lg font-bold text-white shadow-md shadow-emerald-600/25"
        >
          {firstName.charAt(0)}
        </Link>
      </header>

      {/* Balance */}
      <section className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 p-5 text-white shadow-xl shadow-emerald-700/25">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-10 h-48 w-48 rounded-full bg-black/10" />

        <div className="relative flex gap-1 rounded-full bg-black/15 p-1 text-xs font-semibold">
          {periodTabs.map((opt) => {
            const active =
              opt.key === "all" ? periodKind === "all" : opt.period === p;
            return (
              <Link
                key={opt.key}
                href={mkHref({ period: opt.period })}
                className={`flex-1 rounded-full py-1.5 text-center ${
                  active ? "bg-white text-emerald-700 shadow-sm" : "text-white/85"
                }`}
              >
                {opt.label}
              </Link>
            );
          })}
        </div>

        <p className="relative mt-5 text-xs font-medium uppercase tracking-wider text-white/70">
          {periodKind === "all" ? "Balance general" : `Balance de ${periodLabel}`}
        </p>
        <p className="relative mt-1 text-[2.5rem] font-bold leading-tight tracking-tight">
          {formatMoney(balance, base)}
        </p>

        <div className="relative mt-4 grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl bg-white/15 px-3.5 py-2.5 backdrop-blur-sm">
            <p className="flex items-center gap-1.5 text-xs text-white/75">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/25 text-[10px]">↑</span>
              Ingresos
            </p>
            <p className="mt-0.5 truncate font-semibold">{formatMoney(income, base)}</p>
          </div>
          <div className="rounded-2xl bg-white/15 px-3.5 py-2.5 backdrop-blur-sm">
            <p className="flex items-center gap-1.5 text-xs text-white/75">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/25 text-[10px]">↓</span>
              Gastos
            </p>
            <p className="mt-0.5 truncate font-semibold">{formatMoney(expense, base)}</p>
          </div>
        </div>

        <details className="group relative mt-3" open={customPeriod}>
          <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-white/80 [&::-webkit-details-marker]:hidden">
            📅 Ver otro mes o año
            <Icon name="chevronDown" size={14} className="transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
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
                className="rounded-full bg-white/90 px-3 py-1.5 text-black outline-none"
              />
              <button type="submit" className="rounded-full bg-white/20 px-3 py-1.5 font-semibold">
                Ver
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
                className="rounded-full bg-white/90 px-3 py-1.5 text-black outline-none"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <button type="submit" className="rounded-full bg-white/20 px-3 py-1.5 font-semibold">
                Ver
              </button>
            </form>
          </div>
        </details>

        {missingCurrencies.length > 0 && (
          <p className="relative mt-3 rounded-xl bg-amber-300/25 px-3 py-2 text-xs text-white">
            ⚠️ No se incluyen movimientos en {missingCurrencies.join(", ")}: falta
            su tipo de cambio.{" "}
            <Link href="/dashboard/settings" className="font-semibold underline">
              Agregalo en Ajustes
            </Link>
            .
          </p>
        )}
      </section>

      {quickShortcuts.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Atajos rápidos</h2>
            <Link
              href="/dashboard/recurring"
              className="text-xs font-medium text-emerald-700 dark:text-emerald-400"
            >
              Gestionar
            </Link>
          </div>
          <div className="no-scrollbar -mx-5 flex gap-2.5 overflow-x-auto px-5 pb-1">
            {quickShortcuts.map((s) => (
              <form key={s.id} action={quickAddFromTemplate} className="shrink-0">
                <input type="hidden" name="template_id" value={s.id} />
                <SubmitButton
                  pendingLabel={<span className="px-6 text-sm">Agregando…</span>}
                  doneToast={`${s.name} registrado`}
                  className="card flex flex-col items-start gap-0.5 px-4 py-3 text-left"
                >
                  <span className="text-xs text-black/50 dark:text-white/50">{s.name}</span>
                  <span
                    className={`text-sm font-semibold ${
                      s.kind === "income" ? "text-emerald-600 dark:text-emerald-400" : ""
                    }`}
                  >
                    {s.kind === "income" ? "+" : "−"}
                    {formatMoney(s.amount, s.currency)}
                  </span>
                </SubmitButton>
              </form>
            ))}
          </div>
        </section>
      )}

      <AddTransactionSheet
        categories={categories ?? []}
        people={people ?? []}
        baseCurrency={base}
        currencies={currencies}
      />

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Movimientos</h2>
          <div className="flex gap-1 rounded-full bg-black/[0.05] p-0.5 text-xs font-medium dark:bg-white/[0.07]">
            {(
              [
                { key: "all", label: "Todos" },
                { key: "income", label: "Ingresos" },
                { key: "expense", label: "Gastos" },
              ] as const
            ).map((f) => (
              <Link
                key={f.key}
                href={mkHref({ filter: f.key === "all" ? undefined : f.key })}
                className={`rounded-full px-3 py-1 ${
                  listFilter === f.key
                    ? "bg-white shadow-sm dark:bg-white/15"
                    : "text-black/50 dark:text-white/50"
                }`}
              >
                {f.label}
              </Link>
            ))}
          </div>
        </div>

        {txs.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 px-6 py-10 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-3xl">
              🌱
            </span>
            <div>
              <p className="font-semibold">Todo listo para empezar</p>
              <p className="mt-1 text-sm text-black/50 dark:text-white/50">
                Registrá tu primer gasto o ingreso y mirá a dónde se va la plata.
              </p>
            </div>
            <AddTransactionButton className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/25">
              + Agregar movimiento
            </AddTransactionButton>
          </div>
        ) : (
          days.map((g) => (
            <div key={g.day} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between px-1">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-black/45 dark:text-white/45">
                  {formatDayLabel(g.day, today)}
                </h3>
                <span className="text-xs font-medium text-black/40 dark:text-white/40">
                  {g.net >= 0 ? "+" : "−"}
                  {formatMoney(Math.abs(g.net), base)}
                </span>
              </div>
              <ul className="card flex flex-col divide-y divide-black/[0.05] overflow-hidden dark:divide-white/[0.06]">
                {g.items.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/dashboard/${t.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-black/[0.02] active:!scale-100 active:bg-black/[0.04] dark:hover:bg-white/[0.03]"
                    >
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl"
                        style={{
                          backgroundColor: (t.categories?.color ?? "#94a3b8") + "22",
                        }}
                      >
                        {categoryIcon(t.categories?.icon)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium">
                          {t.description || t.categories?.name || "Movimiento"}
                        </p>
                        <p className="truncate text-xs text-black/45 dark:text-white/45">
                          {t.categories?.name ?? "Sin categoría"}
                          {t.occurred_at ? ` · ${formatTime(t.occurred_at)}` : ""}
                        </p>
                        {t.transaction_splits.length > 0 && (
                          <p className="mt-0.5 truncate text-xs text-emerald-700/90 dark:text-emerald-400/90">
                            👥{" "}
                            {t.transaction_splits
                              .map(
                                (s) =>
                                  `${s.people?.name ?? "?"} ${formatMoney(s.amount_resolved, t.currency)}`,
                              )
                              .join(" · ")}
                          </p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 text-[15px] font-semibold ${
                          t.kind === "income" ? "text-emerald-600 dark:text-emerald-400" : ""
                        }`}
                      >
                        {t.kind === "income" ? "+" : "−"}
                        {formatMoney(t.amount, t.currency)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
