"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import {
  addRecurring,
  updateRecurring,
  type RecFormState,
} from "@/app/(app)/dashboard/recurring/actions";
import { categoryIcon } from "@/lib/categoryIcons";

type Category = {
  id: string;
  name: string;
  kind: "expense" | "income";
  icon?: string | null;
};

type Initial = {
  id: string;
  kind: "expense" | "income";
  name: string;
  amount: number;
  currency?: string;
  category_id: string | null;
  frequency: "daily" | "weekly" | "monthly" | "yearly" | null;
  interval: number;
  next_run_on: string | null;
};

const FREQ_LABELS: Record<string, string> = {
  daily: "Diario",
  weekly: "Semanal",
  monthly: "Mensual",
  yearly: "Anual",
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function toYMD(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const selectClasses =
  "w-full rounded-xl border border-black/10 bg-black/[0.03] px-3.5 py-3 text-[15px] text-black outline-none transition-colors focus:border-emerald-500 dark:border-white/10 dark:bg-white/[0.05] dark:text-white";
const inputClasses =
  "w-full rounded-xl border border-black/10 bg-black/[0.03] px-3.5 py-3 text-[15px] text-black outline-none transition-colors focus:border-emerald-500 dark:border-white/10 dark:bg-white/[0.05] dark:text-white";

export function RecurringForm({
  categories,
  initial,
  baseCurrency = "CRC",
  currencies = ["CRC"],
}: {
  categories: Category[];
  initial?: Initial;
  baseCurrency?: string;
  currencies?: string[];
}) {
  const isEdit = Boolean(initial);
  const [kind, setKind] = useState<"expense" | "income">(
    initial?.kind ?? "expense",
  );
  // "auto" = repetir automáticamente según frecuencia. Por defecto off (atajo).
  const [auto, setAuto] = useState(Boolean(initial?.frequency));
  const [state, formAction, pending] = useActionState<RecFormState, FormData>(
    isEdit ? updateRecurring : addRecurring,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok && !isEdit) {
      formRef.current?.reset();
      setKind("expense");
      setAuto(false);
    }
  }, [state, isEdit]);

  const visibleCategories = categories.filter((c) => c.kind === kind);

  // Preservar la moneda original al editar aunque ya no tenga tasa.
  const effectiveCurrencies = [
    ...new Set([
      ...currencies,
      ...(initial?.currency ? [initial.currency] : []),
    ]),
  ];

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3"
    >
      {isEdit && <input type="hidden" name="id" value={initial!.id} />}

      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-black/[0.05] p-1 dark:bg-white/[0.07]">
        {(["expense", "income"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
              kind === k
                ? `bg-white shadow-sm dark:bg-white/15 ${
                    k === "expense"
                      ? "text-rose-600 dark:text-rose-300"
                      : "text-emerald-600 dark:text-emerald-300"
                  }`
                : "text-black/50 dark:text-white/50"
            }`}
          >
            {k === "expense" ? "↓ Gasto" : "↑ Ingreso"}
          </button>
        ))}
      </div>
      <input type="hidden" name="kind" value={kind} />

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Nombre</span>
        <input
          type="text"
          name="name"
          required
          placeholder="Ej. Salario, Pase de bus Ipis…"
          defaultValue={initial?.name ?? ""}
          className={inputClasses}
        />
      </label>

      <div className="flex gap-2">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span className="font-medium">Monto</span>
          <input
            type="number"
            name="amount"
            required
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="0"
            defaultValue={initial?.amount ?? ""}
            className={inputClasses}
          />
        </label>
        {effectiveCurrencies.length > 1 ? (
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Moneda</span>
            <select
              name="currency"
              defaultValue={initial?.currency ?? baseCurrency}
              className={selectClasses}
            >
              {effectiveCurrencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <input
            type="hidden"
            name="currency"
            value={initial?.currency ?? baseCurrency}
          />
        )}
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Categoría</span>
        <select
          name="category_id"
          defaultValue={initial?.category_id ?? ""}
          className={selectClasses}
        >
          <option value="">Sin categoría</option>
          {visibleCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {categoryIcon(c.icon)} {c.name}
            </option>
          ))}
        </select>
      </label>

      <input type="hidden" name="auto" value={auto ? "true" : "false"} />
      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={auto}
          onChange={(e) => setAuto(e.target.checked)}
          className="h-4 w-4 accent-blue-600"
        />
        Repetir automáticamente
      </label>

      {auto && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Frecuencia</span>
              <select
                name="frequency"
                defaultValue={initial?.frequency ?? "monthly"}
                className={selectClasses}
              >
                {Object.entries(FREQ_LABELS).map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Cada</span>
              <input
                type="number"
                name="interval"
                min="1"
                step="1"
                defaultValue={initial?.interval ?? 1}
                className={inputClasses}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Próxima fecha</span>
            <input
              type="date"
              name="next_run_on"
              defaultValue={initial?.next_run_on ?? toYMD(new Date())}
              className={selectClasses}
            />
          </label>
        </>
      )}

      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
      {state?.ok && !isEdit && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          ¡Recurrente creada!
        </p>
      )}

      <div className="mt-1 flex gap-2">
        {isEdit && (
          <Link
            href="/dashboard/recurring"
            className="flex-1 rounded-2xl border border-black/10 px-4 py-3.5 text-center font-semibold transition-colors hover:bg-black/[0.04] dark:border-white/15 dark:hover:bg-white/[0.06]"
          >
            Cancelar
          </Link>
        )}
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-emerald-600/25 transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          {pending ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear recurrente"}
        </button>
      </div>
    </form>
  );
}
