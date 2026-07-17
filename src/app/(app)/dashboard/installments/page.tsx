import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InstallmentForm } from "@/components/InstallmentForm";
import { deletePlan } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { formatMoney } from "@/lib/format";
import { buildRateMap, availableCurrencies } from "@/lib/currency";

type Plan = {
  id: string;
  name: string;
  total_amount: number;
  currency: string;
  installments_count: number;
  is_completed: boolean;
  installment_payments: { amount: number; paid_on: string | null }[];
};

export default async function InstallmentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: categories }, { data: plans }, { data: profile }, { data: rates }] =
    await Promise.all([
      supabase
        .from("categories")
        .select("id, name, kind, icon")
        .eq("is_archived", false)
        .order("name"),
      supabase
        .from("installment_plans")
        .select(
          "id, name, total_amount, currency, installments_count, is_completed, installment_payments(amount, paid_on)",
        )
        .order("is_completed")
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("default_currency").eq("id", user.id).maybeSingle(),
      supabase.from("exchange_rates").select("code, rate_to_base"),
    ]);

  const list = (plans ?? []) as Plan[];
  const base = profile?.default_currency ?? "CRC";
  const currencies = availableCurrencies(base, buildRateMap(rates));

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-5 py-8">
      <header className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="text-sm text-black/60 hover:underline dark:text-white/60"
        >
          ← Volver
        </Link>
        <h1 className="text-xl font-bold tracking-tight">Cuotas</h1>
      </header>

      <InstallmentForm
        categories={categories ?? []}
        baseCurrency={base}
        currencies={currencies}
      />

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-black/70 dark:text-white/70">
          Tus planes
        </h2>
        {list.length === 0 ? (
          <p className="rounded-xl border border-black/10 bg-black/[0.02] px-4 py-6 text-center text-sm text-black/50 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/50">
            Todavía no tenés planes de cuotas.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {list.map((p) => {
              const paidCount = p.installment_payments.filter(
                (x) => x.paid_on,
              ).length;
              const paidAmount = p.installment_payments
                .filter((x) => x.paid_on)
                .reduce((s, x) => s + Number(x.amount), 0);
              const pct = Math.round(
                (paidCount / p.installments_count) * 100,
              );
              return (
                <li
                  key={p.id}
                  className="rounded-xl border border-black/10 p-4 dark:border-white/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/dashboard/installments/${p.id}`} className="min-w-0">
                      <p className="truncate font-medium">
                        {p.name}
                        {p.is_completed && (
                          <span className="ml-2 rounded-full bg-emerald-600/15 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-400">
                            pagado
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-black/50 dark:text-white/50">
                        {paidCount}/{p.installments_count} cuotas ·{" "}
                        {formatMoney(paidAmount, p.currency)} de{" "}
                        {formatMoney(p.total_amount, p.currency)}
                      </p>
                    </Link>
                    <form action={deletePlan}>
                      <input type="hidden" name="id" value={p.id} />
                      <SubmitButton
                        aria-label="Borrar plan"
                        title="Borrar"
                        className="rounded-md px-2 py-1 text-black/30 transition-colors hover:bg-red-500/10 hover:text-red-600 dark:text-white/30 dark:hover:text-red-400"
                      >
                        ✕
                      </SubmitButton>
                    </form>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                    <div
                      className="h-full rounded-full bg-emerald-600"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
