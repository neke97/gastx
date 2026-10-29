import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TransactionForm } from "@/components/TransactionForm";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { PageHeader } from "@/components/PageHeader";
import { deleteTransaction } from "../actions";
import { buildRateMap, availableCurrencies } from "@/lib/currency";

export default async function EditTransactionPage({
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
    { data: people },
    { data: profile },
    { data: rates },
    { data: tx },
    { data: splits },
  ] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, kind, icon")
      .eq("is_archived", false)
      .order("name"),
    supabase.from("people").select("id, name").order("name"),
    supabase.from("profiles").select("default_currency").eq("id", user.id).maybeSingle(),
    supabase.from("exchange_rates").select("code, rate_to_base"),
    supabase
      .from("transactions")
      .select(
        "id, kind, amount, currency, category_id, description, occurred_on, occurred_at",
      )
      .eq("id", id)
      .is("group_id", null) // los gastos de grupo se editan desde el grupo
      .maybeSingle(),
    supabase
      .from("transaction_splits")
      .select("person_id, split_mode, value")
      .eq("transaction_id", id),
  ]);

  if (!tx) notFound();

  const base = profile?.default_currency ?? "CRC";
  const rateMap = buildRateMap(rates);
  const currencies = availableCurrencies(base, rateMap);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-5 py-6">
      <PageHeader title="Editar movimiento" back="/dashboard" />

      <div className="card p-5">
      <TransactionForm
        categories={categories ?? []}
        people={people ?? []}
        baseCurrency={base}
        currencies={currencies}
        initial={tx}
        initialSplits={
          (splits ?? []) as {
            person_id: string;
            split_mode: "amount" | "percent";
            value: number;
          }[]
        }
      />
      </div>

      <form action={deleteTransaction} className="flex justify-center">
        <input type="hidden" name="id" value={tx.id} />
        <input type="hidden" name="back" value="1" />
        <ConfirmSubmitButton
          aria-label="Eliminar movimiento"
          confirmLabel="¿Seguro? Tocá de nuevo para eliminar"
          className="rounded-full px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
          confirmClassName="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
        >
          🗑 Eliminar movimiento
        </ConfirmSubmitButton>
      </form>
    </main>
  );
}
