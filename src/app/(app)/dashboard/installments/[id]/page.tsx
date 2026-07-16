import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { payInstallment, unpayInstallment } from "../actions";
import { formatMoney, formatDate } from "@/lib/format";

type Plan = {
  id: string;
  name: string;
  total_amount: number;
  installments_count: number;
  is_completed: boolean;
};
type Payment = {
  id: string;
  number: number;
  due_date: string;
  amount: number;
  paid_on: string | null;
};

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: plan }, { data: payments }] = await Promise.all([
    supabase
      .from("installment_plans")
      .select("id, name, total_amount, installments_count, is_completed")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("installment_payments")
      .select("id, number, due_date, amount, paid_on")
      .eq("installment_plan_id", id)
      .order("number"),
  ]);

  if (!plan) notFound();
  const p = plan as Plan;
  const list = (payments ?? []) as Payment[];

  const paidAmount = list
    .filter((x) => x.paid_on)
    .reduce((s, x) => s + Number(x.amount), 0);
  const remaining = Math.round((p.total_amount - paidAmount) * 100) / 100;
  const nextDue = list.find((x) => !x.paid_on);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-5 py-8">
      <header className="flex items-center gap-3">
        <Link
          href="/dashboard/installments"
          className="text-sm text-black/60 hover:underline dark:text-white/60"
        >
          ← Volver
        </Link>
        <h1 className="text-xl font-bold tracking-tight">{p.name}</h1>
      </header>

      <section className="rounded-2xl border border-black/10 bg-gradient-to-br from-emerald-500/10 to-transparent p-5 dark:border-white/10">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-black/50 dark:text-white/50">Falta pagar</p>
            <p className="text-2xl font-bold tracking-tight">
              {formatMoney(remaining)}
            </p>
          </div>
          <div>
            <p className="text-black/50 dark:text-white/50">Total</p>
            <p className="text-2xl font-bold tracking-tight">
              {formatMoney(p.total_amount)}
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-black/50 dark:text-white/50">
          {p.is_completed
            ? "Plan completado 🎉"
            : nextDue
              ? `Próxima cuota: #${nextDue.number} el ${formatDate(nextDue.due_date)}`
              : ""}
        </p>
      </section>

      <ul className="flex flex-col divide-y divide-black/5 overflow-hidden rounded-xl border border-black/10 dark:divide-white/5 dark:border-white/10">
        {list.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between gap-3 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">
                Cuota {c.number}/{p.installments_count} · {formatMoney(c.amount)}
              </p>
              <p className="text-xs text-black/50 dark:text-white/50">
                {c.paid_on
                  ? `Pagada el ${formatDate(c.paid_on)}`
                  : `Vence ${formatDate(c.due_date)}`}
              </p>
            </div>
            {c.paid_on ? (
              <form action={unpayInstallment}>
                <input type="hidden" name="payment_id" value={c.id} />
                <button
                  type="submit"
                  className="rounded-lg border border-black/15 px-3 py-1.5 text-xs transition-colors hover:bg-black/[0.04] dark:border-white/15 dark:hover:bg-white/[0.06]"
                >
                  Desmarcar
                </button>
              </form>
            ) : (
              <form action={payInstallment}>
                <input type="hidden" name="payment_id" value={c.id} />
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
                >
                  Pagar
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
