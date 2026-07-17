import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { payInstallment, unpayInstallment, updatePlanInfo } from "../actions";
import { SubmitButton } from "@/components/SubmitButton";
import { formatMoney, formatDate } from "@/lib/format";
import { categoryIcon } from "@/lib/categoryIcons";

type Plan = {
  id: string;
  name: string;
  total_amount: number;
  currency: string;
  category_id: string | null;
  installments_count: number;
  is_completed: boolean;
};
type Cat = { id: string; name: string; kind: "expense" | "income"; icon: string | null };

const selectClasses =
  "rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm text-black outline-none focus:border-emerald-500 dark:border-white/15 dark:bg-neutral-900 dark:text-white";
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

  const [{ data: plan }, { data: payments }, { data: categories }] =
    await Promise.all([
      supabase
        .from("installment_plans")
        .select(
          "id, name, total_amount, currency, category_id, installments_count, is_completed",
        )
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("installment_payments")
        .select("id, number, due_date, amount, paid_on")
        .eq("installment_plan_id", id)
        .order("number"),
      supabase
        .from("categories")
        .select("id, name, kind, icon")
        .eq("kind", "expense")
        .eq("is_archived", false)
        .order("name"),
    ]);

  if (!plan) notFound();
  const p = plan as Plan;
  const list = (payments ?? []) as Payment[];
  const cats = (categories ?? []) as Cat[];
  const todayStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Costa_Rica",
  }).format(new Date()); // YYYY-MM-DD

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
              {formatMoney(remaining, p.currency)}
            </p>
          </div>
          <div>
            <p className="text-black/50 dark:text-white/50">Total</p>
            <p className="text-2xl font-bold tracking-tight">
              {formatMoney(p.total_amount, p.currency)}
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

      {/* Editar el plan (nombre y categoría) */}
      <details className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
        <summary className="cursor-pointer text-sm font-semibold text-black/70 dark:text-white/70">
          Editar plan
        </summary>
        <form action={updatePlanInfo} className="mt-3 flex flex-col gap-3">
          <input type="hidden" name="plan_id" value={p.id} />
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Nombre</span>
            <input
              type="text"
              name="name"
              required
              defaultValue={p.name}
              className="rounded-lg border border-black/15 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-white/15"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Categoría</span>
            <select
              name="category_id"
              defaultValue={p.category_id ?? ""}
              className={selectClasses}
            >
              <option value="">Sin categoría</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {categoryIcon(c.icon)} {c.name}
                </option>
              ))}
            </select>
          </label>
          <SubmitButton
            pendingLabel="Guardando…"
            className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            Guardar cambios
          </SubmitButton>
        </form>
      </details>

      <p className="text-xs text-black/50 dark:text-white/50">
        Consejo: si una cuota ya venció y la pagaste (incluso antes de usar la
        app), tocá <span className="font-medium">Pagar</span>: se registra en su
        fecha de vencimiento.
      </p>

      <ul className="flex flex-col divide-y divide-black/5 overflow-hidden rounded-xl border border-black/10 dark:divide-white/5 dark:border-white/10">
        {list.map((c) => {
          const overdue = !c.paid_on && c.due_date < todayStr;
          return (
          <li
            key={c.id}
            className="flex items-center justify-between gap-3 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">
                Cuota {c.number}/{p.installments_count} ·{" "}
                {formatMoney(c.amount, p.currency)}
              </p>
              <p
                className={`text-xs ${
                  overdue
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-black/50 dark:text-white/50"
                }`}
              >
                {c.paid_on
                  ? `Pagada el ${formatDate(c.paid_on)}`
                  : overdue
                    ? `Vencida el ${formatDate(c.due_date)}`
                    : `Vence ${formatDate(c.due_date)}`}
              </p>
            </div>
            {c.paid_on ? (
              <form action={unpayInstallment}>
                <input type="hidden" name="payment_id" value={c.id} />
                <SubmitButton
                  pendingLabel="…"
                  className="rounded-lg border border-black/15 px-3 py-1.5 text-xs transition-colors hover:bg-black/[0.04] dark:border-white/15 dark:hover:bg-white/[0.06]"
                >
                  Desmarcar
                </SubmitButton>
              </form>
            ) : (
              <form action={payInstallment}>
                <input type="hidden" name="payment_id" value={c.id} />
                <SubmitButton
                  pendingLabel="Pagando…"
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
                >
                  Pagar
                </SubmitButton>
              </form>
            )}
          </li>
          );
        })}
      </ul>
    </main>
  );
}
