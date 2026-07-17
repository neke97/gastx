import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TransactionForm } from "@/components/TransactionForm";
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
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-5 py-8">
      <header className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="text-sm text-black/60 hover:underline dark:text-white/60"
        >
          ← Volver
        </Link>
        <h1 className="text-xl font-bold tracking-tight">Editar movimiento</h1>
      </header>

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
    </main>
  );
}
