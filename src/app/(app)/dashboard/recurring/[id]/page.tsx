import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RecurringForm } from "@/components/RecurringForm";
import { formatMoney, formatDate } from "@/lib/format";

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

  const [{ data: categories }, { data: tpl }, { data: history }] =
    await Promise.all([
      supabase
        .from("categories")
        .select("id, name, kind")
        .eq("is_archived", false)
        .order("name"),
      supabase
        .from("recurring_templates")
        .select(
          "id, kind, name, amount, category_id, frequency, interval, next_run_on",
        )
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("recurring_amount_history")
        .select("id, amount, effective_from")
        .eq("recurring_template_id", id)
        .order("effective_from", { ascending: false }),
    ]);

  if (!tpl) notFound();

  const hist = (history ?? []) as History[];

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-5 py-8">
      <header className="flex items-center gap-3">
        <Link
          href="/dashboard/recurring"
          className="text-sm text-black/60 hover:underline dark:text-white/60"
        >
          ← Volver
        </Link>
        <h1 className="text-xl font-bold tracking-tight">Editar recurrente</h1>
      </header>

      <RecurringForm categories={categories ?? []} initial={tpl} />

      {hist.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-black/70 dark:text-white/70">
            Historial de precio
          </h2>
          <ul className="flex flex-col divide-y divide-black/5 overflow-hidden rounded-xl border border-black/10 dark:divide-white/5 dark:border-white/10">
            {hist.map((h) => (
              <li
                key={h.id}
                className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
              >
                <span className="font-medium">{formatMoney(h.amount)}</span>
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
