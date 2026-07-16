import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CategoryDonut, type DonutSlice } from "@/components/CategoryDonut";
import { MonthlyBars, type MonthDatum } from "@/components/MonthlyBars";

const OTHER_COLOR = "#64748b";
const MAX_SLICES = 8;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default async function ReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonthStart = `${next.getFullYear()}-${pad(next.getMonth() + 1)}-01`;

  // Inicio de la ventana de 6 meses (mes actual incluido).
  const windowStartDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const windowStart = `${windowStartDate.getFullYear()}-${pad(windowStartDate.getMonth() + 1)}-01`;

  const [{ data: monthExpenses }, { data: sixMonths }] = await Promise.all([
    supabase
      .from("transactions")
      .select("amount, categories(name, color)")
      .eq("kind", "expense")
      .gte("occurred_on", monthStart)
      .lt("occurred_on", nextMonthStart),
    supabase
      .from("transactions")
      .select("kind, amount, occurred_on")
      .gte("occurred_on", windowStart),
  ]);

  // ---- Dona: gastos del mes por categoría ----
  const byCat = new Map<string, DonutSlice>();
  for (const row of monthExpenses ?? []) {
    const cat = row.categories as unknown as {
      name: string;
      color: string | null;
    } | null;
    const name = cat?.name ?? "Sin categoría";
    const color = cat?.color ?? OTHER_COLOR;
    const prev = byCat.get(name);
    if (prev) prev.amount += Number(row.amount);
    else byCat.set(name, { name, color, amount: Number(row.amount) });
  }
  let slices = [...byCat.values()].sort((a, b) => b.amount - a.amount);
  if (slices.length > MAX_SLICES) {
    const top = slices.slice(0, MAX_SLICES);
    const rest = slices.slice(MAX_SLICES);
    const otrosAmount = rest.reduce((s, x) => s + x.amount, 0);
    slices = [...top, { name: "Otros", color: OTHER_COLOR, amount: otrosAmount }];
  }
  const totalExpenses = slices.reduce((s, x) => s + x.amount, 0);

  // ---- Barras: ingresos vs gastos, últimos 6 meses ----
  const buckets: MonthDatum[] = [];
  const keyIndex = new Map<string, number>();
  const fmtMonth = new Intl.DateTimeFormat("es-CR", { month: "short" });
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
    keyIndex.set(key, buckets.length);
    buckets.push({ label: fmtMonth.format(d), income: 0, expense: 0 });
  }
  for (const row of sixMonths ?? []) {
    const key = String(row.occurred_on).slice(0, 7);
    const idx = keyIndex.get(key);
    if (idx == null) continue;
    if (row.kind === "income") buckets[idx].income += Number(row.amount);
    else buckets[idx].expense += Number(row.amount);
  }

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

      <section className="flex flex-col gap-4 rounded-2xl border border-black/10 p-5 dark:border-white/10">
        <h2 className="text-sm font-semibold text-black/70 dark:text-white/70">
          En qué se va la plata (este mes)
        </h2>
        {totalExpenses > 0 ? (
          <CategoryDonut slices={slices} total={totalExpenses} />
        ) : (
          <p className="py-6 text-center text-sm text-black/50 dark:text-white/50">
            No hay gastos este mes todavía.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-black/10 p-5 dark:border-white/10">
        <h2 className="text-sm font-semibold text-black/70 dark:text-white/70">
          Ingresos vs gastos (últimos 6 meses)
        </h2>
        <MonthlyBars data={buckets} />
      </section>
    </main>
  );
}
