import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RecurringForm } from "@/components/RecurringForm";
import { formatMoney, formatDate } from "@/lib/format";
import { buildRateMap, availableCurrencies } from "@/lib/currency";
import { PageHeader } from "@/components/PageHeader";

type History = { id: string; amount: number; effective_from: string };

export default async function EditRecurringPage({
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

  const [
    { data: categories },
    { data: tpl },
    { data: history },
    { data: profile },
    { data: rates },
  ] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, kind, icon")
      .eq("is_archived", false)
      .order("name"),
    supabase
      .from("recurring_templates")
      .select(
        "id, kind, name, amount, currency, category_id, frequency, interval, next_run_on",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("recurring_amount_history")
      .select("id, amount, effective_from")
      .eq("recurring_template_id", id)
      .order("effective_from", { ascending: false }),
    supabase.from("profiles").select("default_currency").eq("id", user.id).maybeSingle(),
    supabase.from("exchange_rates").select("code, rate_to_base"),
  ]);

  if (!tpl) notFound();

  const hist = (history ?? []) as History[];
  const base = profile?.default_currency ?? "CRC";
  const currencies = availableCurrencies(base, buildRateMap(rates));

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-5 py-6">
      <PageHeader title="Editar recurrente" back="/dashboard/recurring" />

      <RecurringForm
        categories={categories ?? []}
        initial={tpl}
        baseCurrency={base}
        currencies={currencies}
      />

      {hist.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-black/70 dark:text-white/70">
            Historial de precio
          </h2>
          <ul className="flex flex-col divide-y divide-black/5 overflow-hidden card dark:divide-white/5">
            {hist.map((h) => (
              <li
                key={h.id}
                className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
              >
                <span className="font-medium">
                  {formatMoney(h.amount, tpl.currency)}
                </span>
                <span className="text-xs text-black/50 dark:text-white/50">
                  desde {formatDate(h.effective_from)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
