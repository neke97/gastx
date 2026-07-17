import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CategoryDonut, type DonutSlice } from "@/components/CategoryDonut";
import { MonthlyBars, type MonthDatum } from "@/components/MonthlyBars";
import { BalanceTrend, type TrendPoint } from "@/components/BalanceTrend";
import { buildRateMap, toBase } from "@/lib/currency";

const OTHER_COLOR = "#64748b";
const MAX_SLICES = 8;

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function ym(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}
function firstOfMonth(ymStr: string) {
  return `${ymStr}-01`;
}
/** Suma `months` (puede ser negativo) a un "YYYY-MM" y devuelve "YYYY-MM". */
function addMonths(ymStr: string, months: number) {
  const [y, m] = ymStr.split("-").map(Number);
  const d = new Date(y, m - 1 + months, 1);
  return ym(d);
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now = new Date();
  const currentYM = ym(now);
  const { month } = await searchParams;
  // Mes seleccionado (validado); por defecto el mes actual.
  const selectedYM = /^\d{4}-\d{2}$/.test(month ?? "") ? month! : currentYM;

  const monthStart = firstOfMonth(selectedYM);
  const nextMonthStart = firstOfMonth(addMonths(selectedYM, 1));
  const windowStart = firstOfMonth(addMonths(selectedYM, -5));

  const prevYM = addMonths(selectedYM, -1);
  const nextYM = addMonths(selectedYM, 1);
  const canGoNext = selectedYM < currentYM;

  const monthLabel = new Intl.DateTimeFormat("es-CR", {
    month: "long",
    year: "numeric",
  }).format(new Date(Number(selectedYM.slice(0, 4)), Number(selectedYM.slice(5)) - 1, 1));

  const [{ data: profile }, { data: rates }, { data: monthExpenses }, { data: windowRows }] =
    await Promise.all([
      supabase.from("profiles").select("default_currency").eq("id", user.id).maybeSingle(),
      supabase.from("exchange_rates").select("code, rate_to_base"),
      supabase
        .from("transactions")
        .select("amount, currency, categories(name, color)")
        .eq("kind", "expense")
        .is("group_id", null)
        .gte("occurred_on", monthStart)
        .lt("occurred_on", nextMonthStart),
      supabase
        .from("transactions")
        .select("kind, amount, currency, occurred_on")
        .is("group_id", null)
        .gte("occurred_on", windowStart)
        .lt("occurred_on", nextMonthStart),
    ]);

  const base = profile?.default_currency ?? "CRC";
  const rateMap = buildRateMap(rates);

  // ---- Dona: gastos del mes seleccionado por categoría ----
  const byCat = new Map<string, DonutSlice>();
  for (const row of monthExpenses ?? []) {
    const cat = row.categories as unknown as {
      name: string;
      color: string | null;
    } | null;
    const name = cat?.name ?? "Sin categoría";
    const color = cat?.color ?? OTHER_COLOR;
    const value = toBase(Number(row.amount), row.currency, base, rateMap);
    const prev = byCat.get(name);
    if (prev) prev.amount += value;
    else byCat.set(name, { name, color, amount: value });
  }
  let slices = [...byCat.values()].sort((a, b) => b.amount - a.amount);
  if (slices.length > MAX_SLICES) {
    const top = slices.slice(0, MAX_SLICES);
    const rest = slices.slice(MAX_SLICES);
    const otrosAmount = rest.reduce((s, x) => s + x.amount, 0);
    slices = [...top, { name: "Otros", color: OTHER_COLOR, amount: otrosAmount }];
  }
  const totalExpenses = slices.reduce((s, x) => s + x.amount, 0);

  // ---- Barras + tendencia: 6 meses terminando en el seleccionado ----
  const buckets: MonthDatum[] = [];
  const keyIndex = new Map<string, number>();
  const fmtMonth = new Intl.DateTimeFormat("es-CR", { month: "short" });
  for (let i = 5; i >= 0; i--) {
    const key = addMonths(selectedYM, -i);
    const d = new Date(Number(key.slice(0, 4)), Number(key.slice(5)) - 1, 1);
    keyIndex.set(key, buckets.length);
    buckets.push({ label: fmtMonth.format(d), income: 0, expense: 0 });
  }
  for (const row of windowRows ?? []) {
    const key = String(row.occurred_on).slice(0, 7);
    const idx = keyIndex.get(key);
    if (idx == null) continue;
    const value = toBase(Number(row.amount), row.currency, base, rateMap);
    if (row.kind === "income") buckets[idx].income += value;
    else buckets[idx].expense += value;
  }
  const trend: TrendPoint[] = buckets.map((b) => ({
    label: b.label,
    value: b.income - b.expense,
  }));

  const navBtn =
    "rounded-lg border border-black/15 px-3 py-1.5 text-sm transition-colors hover:bg-black/[0.04] dark:border-white/15 dark:hover:bg-white/[0.06]";

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-5 py-8">
      <header className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="text-sm text-black/60 hover:underline dark:text-white/60"
        >
          ← Volver
        </Link>
        <h1 className="text-xl font-bold tracking-tight">Reportes</h1>
      </header>

      {/* Filtro por mes */}
      <div className="flex items-center justify-between gap-2">
        <Link href={`/dashboard/reports?month=${prevYM}`} className={navBtn}>
          ← Mes ant.
        </Link>
        <span className="text-sm font-medium capitalize">{monthLabel}</span>
        {canGoNext ? (
          <Link href={`/dashboard/reports?month=${nextYM}`} className={navBtn}>
            Mes sig. →
          </Link>
        ) : (
          <span className={`${navBtn} pointer-events-none opacity-40`}>
            Mes sig. →
          </span>
        )}
      </div>

      <section className="flex flex-col gap-4 rounded-2xl border border-black/10 p-5 dark:border-white/10">
        <h2 className="text-sm font-semibold text-black/70 dark:text-white/70">
          En qué se va la plata
        </h2>
        {totalExpenses > 0 ? (
          <CategoryDonut slices={slices} total={totalExpenses} currency={base} />
        ) : (
          <p className="py-6 text-center text-sm text-black/50 dark:text-white/50">
            No hay gastos en este mes.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-black/10 p-5 dark:border-white/10">
        <h2 className="text-sm font-semibold text-black/70 dark:text-white/70">
          Ingresos vs gastos (6 meses)
        </h2>
        <MonthlyBars data={buckets} currency={base} />
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-black/10 p-5 dark:border-white/10">
        <h2 className="text-sm font-semibold text-black/70 dark:text-white/70">
          Tendencia del balance
        </h2>
        <BalanceTrend data={trend} currency={base} />
      </section>
    </main>
  );
}
