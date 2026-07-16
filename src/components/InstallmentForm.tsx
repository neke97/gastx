"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addPlan, type PlanFormState } from "@/app/(app)/dashboard/installments/actions";
import { formatMoney } from "@/lib/format";

type Category = { id: string; name: string; kind: "expense" | "income" };

const FREQ_LABELS: Record<string, string> = {
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

export function InstallmentForm({ categories }: { categories: Category[] }) {
  const [total, setTotal] = useState("");
  const [count, setCount] = useState("");
  const [state, formAction, pending] = useActionState<PlanFormState, FormData>(
    addPlan,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      setTotal("");
      setCount("");
    }
  }, [state]);

  const totalNum = Number(total) || 0;
  const countNum = Number(count) || 0;
  const perInstallment =
    countNum > 0 ? Math.round((totalNum / countNum) * 100) / 100 : 0;

  const expenseCats = categories.filter((c) => c.kind === "expense");

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.03]"
    >
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Nombre</span>
        <input
          type="text"
          name="name"
          required
          placeholder="Ej. Refrigeradora, Celular…"
          className={inputClasses}
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Total (₡)</span>
          <input
            type="number"
            name="total_amount"
            required
            min="0"
            step="0.01"
            inputMode="decimal"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            className={inputClasses}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium"># de cuotas</span>
          <input
            type="number"
            name="installments_count"
            required
            min="1"
            step="1"
            value={count}
            onChange={(e) => setCount(e.target.value)}
            className={inputClasses}
          />
        </label>
      </div>

      {perInstallment > 0 && (
        <p className="text-sm text-black/60 dark:text-white/60">
          ≈ {formatMoney(perInstallment)} por cuota
        </p>
      )}

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Categoría</span>
        <select name="category_id" defaultValue="" className={selectClasses}>
          <option value="">Sin categoría</option>
          {expenseCats.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Primera cuota</span>
          <input
            type="date"
            name="start_date"
            required
            defaultValue={toYMD(new Date())}
            className={selectClasses}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Frecuencia</span>
          <select name="frequency" defaultValue="monthly" className={selectClasses}>
            {Object.entries(FREQ_LABELS).map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
      {state?.ok && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          ¡Plan creado!
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "Creando…" : "Crear plan de cuotas"}
      </button>
    </form>
  );
}
