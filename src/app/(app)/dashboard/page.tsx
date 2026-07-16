import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut, deleteTransaction } from "./actions";
import { TransactionForm } from "@/components/TransactionForm";
import { formatMoney, formatDate } from "@/lib/format";

type TxRow = {
  id: string;
  kind: "expense" | "income";
  amount: number;
  description: string | null;
  occurred_on: string;
  categories: { name: string } | null;
  transaction_splits: {
    amount_resolved: number;
    people: { name: string } | null;
  }[];
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Rango del mes actual (formato YYYY-MM-DD para comparar con occurred_on).
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonthStart = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`;

  const [
    { data: categories },
    { data: people },
    { data: transactions },
    { data: monthRows },
  ] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, kind")
      .eq("is_archived", false)
      .order("name"),
    supabase.from("people").select("id, name").order("name"),
    supabase
      .from("transactions")
      .select(
        "id, kind, amount, description, occurred_on, categories(name), transaction_splits(amount_resolved, people(name))",
      )
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("transactions")
      .select("kind, amount")
      .gte("occurred_on", monthStart)
      .lt("occurred_on", nextMonthStart),
  ]);

  const txs = (transactions ?? []) as unknown as TxRow[];

  const income = (monthRows ?? [])
    .filter((r) => r.kind === "income")
    .reduce((sum, r) => sum + Number(r.amount), 0);
  const expense = (monthRows ?? [])
    .filter((r) => r.kind === "expense")
    .reduce((sum, r) => sum + Number(r.amount), 0);
  const balance = income - expense;

  const monthLabel = new Intl.DateTimeFormat("es-CR", {
    month: "long",
    year: "numeric",
  }).format(now);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-5 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hola 👋</h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            {user.email}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/categories"
            className="rounded-lg border border-black/15 px-3 py-2 text-sm transition-colors hover:bg-black/[0.04] dark:border-white/15 dark:hover:bg-white/[0.06]"
          >
            Categorías
          </Link>
          <Link
            href="/dashboard/people"
            className="rounded-lg border border-black/15 px-3 py-2 text-sm transition-colors hover:bg-black/[0.04] dark:border-white/15 dark:hover:bg-white/[0.06]"
          >
            Personas
          </Link>
          <form action={signOut}>
            <button className="rounded-lg border border-black/15 px-3 py-2 text-sm transition-colors hover:bg-black/[0.04] dark:border-white/15 dark:hover:bg-white/[0.06]">
              Salir
            </button>
          </form>
        </div>
      </header>

      <section className="rounded-2xl border border-black/10 bg-gradient-to-br from-emerald-500/10 to-transparent p-5 dark:border-white/10">
        <p className="text-xs font-medium uppercase tracking-wide text-black/50 dark:text-white/50">
          Balance de {monthLabel}
        </p>
        <p
          className={`mt-1 text-3xl font-bold tracking-tight ${
            balance >= 0
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {formatMoney(balance)}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-black/[0.03] px-3 py-2 dark:bg-white/[0.04]">
            <p className="text-black/50 dark:text-white/50">Ingresos</p>
            <p className="font-semibold text-emerald-600 dark:text-emerald-400">
              {formatMoney(income)}
            </p>
          </div>
          <div className="rounded-xl bg-black/[0.03] px-3 py-2 dark:bg-white/[0.04]">
            <p className="text-black/50 dark:text-white/50">Gastos</p>
            <p className="font-semibold text-red-600 dark:text-red-400">
              {formatMoney(expense)}
            </p>
          </div>
        </div>
      </section>

      <TransactionForm categories={categories ?? []} people={people ?? []} />

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-black/70 dark:text-white/70">
          Últimos movimientos
        </h2>

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
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {t.description || t.categories?.name || "Movimiento"}
                  </p>
                  <p className="text-xs text-black/50 dark:text-white/50">
                    {t.categories?.name ? `${t.categories.name} · ` : ""}
                    {formatDate(t.occurred_on)}
                  </p>
                  {t.transaction_splits.length > 0 && (
                    <p className="mt-0.5 truncate text-xs text-emerald-700/80 dark:text-emerald-400/80">
                      Dividido:{" "}
                      {t.transaction_splits
                        .map(
                          (s) =>
                            `${s.people?.name ?? "?"} ${formatMoney(s.amount_resolved)}`,
                        )
                        .join(" · ")}
                    </p>
                  )}
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
                    {formatMoney(t.amount)}
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
                    <button
                      type="submit"
                      aria-label="Borrar movimiento"
                      title="Borrar"
                      className="rounded-md px-2 py-1 text-black/30 transition-colors hover:bg-red-500/10 hover:text-red-600 dark:text-white/30 dark:hover:text-red-400"
                    >
                      ✕
                    </button>
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
