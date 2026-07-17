import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubmitButton } from "@/components/SubmitButton";
import { COMMON_CURRENCIES } from "@/lib/currency";
import { updateBaseCurrency, upsertRate, deleteRate } from "./actions";

type Rate = { id: string; code: string; rate_to_base: number };

const selectClasses =
  "rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm text-black outline-none focus:border-emerald-500 dark:border-white/15 dark:bg-neutral-900 dark:text-white";
const inputClasses =
  "rounded-lg border border-black/15 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-white/15";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: rates }] = await Promise.all([
    supabase.from("profiles").select("default_currency").eq("id", user.id).maybeSingle(),
    supabase
      .from("exchange_rates")
      .select("id, code, rate_to_base")
      .order("code"),
  ]);

  const base = profile?.default_currency ?? "CRC";
  const rateList = (rates ?? []) as Rate[];

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-5 py-8">
      <header className="flex items-center gap-3">
        <Link
          href="/dashboard/more"
          className="text-sm text-black/60 hover:underline dark:text-white/60"
        >
          ← Volver
        </Link>
        <h1 className="text-xl font-bold tracking-tight">Ajustes</h1>
      </header>

      {/* Moneda base */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-black/70 dark:text-white/70">
          Moneda base
        </h2>
        <p className="text-xs text-black/50 dark:text-white/50">
          Los totales y reportes se muestran en esta moneda.
        </p>
        <form action={updateBaseCurrency} className="flex gap-2">
          <select name="base" defaultValue={base} className={`flex-1 ${selectClasses}`}>
            {[...new Set([base, ...COMMON_CURRENCIES])].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <SubmitButton
            pendingLabel="Guardando…"
            className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            Guardar
          </SubmitButton>
        </form>
      </section>

      {/* Tipos de cambio */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-black/70 dark:text-white/70">
          Tipos de cambio
        </h2>
        <p className="text-xs text-black/50 dark:text-white/50">
          Cuántas unidades de {base} vale 1 unidad de otra moneda (ej. 1 USD ={" "}
          {base === "CRC" ? "525" : "…"} {base}).
        </p>

        <form
          action={upsertRate}
          className="flex flex-col gap-3 rounded-xl border border-black/10 p-3 dark:border-white/10"
        >
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-xs">
              Moneda
              <select name="code" className={selectClasses} defaultValue="USD">
                {COMMON_CURRENCIES.filter((c) => c !== base).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs">
              1 unidad = {base}
              <input
                type="number"
                name="rate"
                required
                min="0"
                step="0.000001"
                inputMode="decimal"
                placeholder="525"
                className={inputClasses}
              />
            </label>
          </div>
          <SubmitButton
            pendingLabel="…"
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            Guardar tipo de cambio
          </SubmitButton>
        </form>

        {rateList.length === 0 ? (
          <p className="rounded-xl border border-black/10 bg-black/[0.02] px-4 py-4 text-center text-sm text-black/50 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/50">
            Sin tipos de cambio. Con solo la moneda base, la app funciona en una moneda.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-black/5 overflow-hidden rounded-xl border border-black/10 dark:divide-white/5 dark:border-white/10">
            {rateList.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <span>
                  1 {r.code} = {r.rate_to_base} {base}
                </span>
                <form action={deleteRate}>
                  <input type="hidden" name="id" value={r.id} />
                  <SubmitButton
                    aria-label="Borrar tipo de cambio"
                    title="Borrar"
                    className="rounded-md px-2 py-1 text-black/30 transition-colors hover:bg-red-500/10 hover:text-red-600 dark:text-white/30 dark:hover:text-red-400"
                  >
                    ✕
                  </SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
