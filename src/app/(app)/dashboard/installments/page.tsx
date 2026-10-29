import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InstallmentForm } from "@/components/InstallmentForm";
import { deletePlan } from "./actions";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { PageHeader } from "@/components/PageHeader";
import { Icon } from "@/components/Icon";
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
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-5 py-6">
      <PageHeader title="Cuotas" subtitle="Tus compras a plazos, bajo control" />

      <details className="card group overflow-hidden" open={list.length === 0}>
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 font-semibold [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"><Icon name="plus" size={16} /></span>
            Nuevo plan de cuotas
          </span>
          <Icon name="chevronDown" className="text-black/40 transition-transform group-open:rotate-180 dark:text-white/40" />
        </summary>
        <div className="px-5 pb-5">
          <InstallmentForm
            categories={categories ?? []}
            baseCurrency={base}
            currencies={currencies}
          />
        </div>
      </details>

      <section className="flex flex-col gap-2.5">
        <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-black/45 dark:text-white/45">
          Tus planes
        </h2>
        {list.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 px-6 py-8 text-center">
            <span className="text-3xl">💳</span>
            <p className="text-sm text-black/55 dark:text-white/55">
              ¿Compraste algo a plazos? Agregalo y mirá cuánto te falta pagar.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2.5">
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
              const left = Math.max(0, Number(p.total_amount) - paidAmount);
              return (
                <li key={p.id} className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/dashboard/installments/${p.id}`} className="min-w-0 flex-1 active:!scale-100">
                      <p className="flex items-center gap-2 truncate font-semibold">
                        {p.name}
                        {p.is_completed && (
                          <span className="rounded-full bg-emerald-600/15 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                            ✓ pagado
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-black/50 dark:text-white/50">
                        {paidCount} de {p.installments_count} cuotas ·{" "}
                        {formatMoney(paidAmount, p.currency)} de{" "}
                        {formatMoney(p.total_amount, p.currency)}
                      </p>
                    </Link>
                    <span className="shrink-0 text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {pct}%
                    </span>
                  </div>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-black/[0.07] dark:bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-sm">
                      {p.is_completed ? (
                        <span className="text-black/50 dark:text-white/50">¡Terminaste de pagar! 🎉</span>
                      ) : (
                        <>
                          <span className="text-black/50 dark:text-white/50">Falta </span>
                          <span className="font-semibold">{formatMoney(left, p.currency)}</span>
                        </>
                      )}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/dashboard/installments/${p.id}`}
                        className="rounded-xl bg-black/[0.05] px-3 py-1.5 text-sm font-medium dark:bg-white/[0.07]"
                      >
                        Ver cuotas
                      </Link>
                      <form action={deletePlan}>
                        <input type="hidden" name="id" value={p.id} />
                        <ConfirmSubmitButton
                          aria-label="Borrar plan"
                          confirmLabel="¿Borrar?"
                          className="rounded-xl bg-black/[0.05] px-3 py-1.5 text-sm text-black/50 dark:bg-white/[0.07] dark:text-white/55"
                          confirmClassName="rounded-xl bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white"
                        >
                          <Icon name="trash" size={16} />
                        </ConfirmSubmitButton>
                      </form>
                    </div>
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
