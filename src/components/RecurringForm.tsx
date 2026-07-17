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
  "rounded-lg border border-black/15 bg-white px-3 py-2.5 text-black outline-none focus:border-emerald-500 dark:border-white/15 dark:bg-neutral-900 dark:text-white";
const inputClasses =
  "rounded-lg border border-black/15 bg-transparent px-3 py-2.5 outline-none focus:border-emerald-500 dark:border-white/15";

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

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.03]"
    >
      {isEdit && <input type="hidden" name="id" value={initial!.id} />}

      <div className="grid grid-cols-2 gap-2">
        {(["expense", "income"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              kind === k
                ? k === "expense"
                  ? "bg-red-600 text-white"
                  : "bg-emerald-600 text-white"
                : "border border-black/15 dark:border-white/15"
            }`}
          >
            {k === "expense" ? "Gasto" : "Ingreso"}
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
        {currencies.length > 1 ? (
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Moneda</span>
            <select
              name="currency"
              defaultValue={initial?.currency ?? baseCurrency}
              className={selectClasses}
            >
              {currencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <input type="hidden" name="currency" value={baseCurrency} />
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
            className="flex-1 rounded-lg border border-black/15 px-4 py-2.5 text-center font-medium transition-colors hover:bg-black/[0.04] dark:border-white/15 dark:hover:bg-white/[0.06]"
          >
            Cancelar
          </Link>
        )}
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
        >
          {pending ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear recurrente"}
        </button>
      </div>
    </form>
  );
}
