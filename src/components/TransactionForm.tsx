"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addTransaction, type TxFormState } from "@/app/(app)/dashboard/actions";

type Category = { id: string; name: string; kind: "expense" | "income" };

export function TransactionForm({ categories }: { categories: Category[] }) {
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const [state, formAction, pending] = useActionState<TxFormState, FormData>(
    addTransaction,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Al guardar bien, limpiar el formulario.
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  const visibleCategories = categories.filter((c) => c.kind === kind);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.03]"
    >
      {/* Tipo: gasto / ingreso */}
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
        <span className="font-medium">Monto (₡)</span>
        <input
          type="number"
          name="amount"
          required
          min="0"
          step="0.01"
          inputMode="decimal"
          placeholder="0"
          className="rounded-lg border border-black/15 bg-transparent px-3 py-2.5 outline-none focus:border-emerald-500 dark:border-white/15"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Categoría</span>
        <select
          name="category_id"
          className="rounded-lg border border-black/15 bg-transparent px-3 py-2.5 outline-none focus:border-emerald-500 dark:border-white/15"
        >
          <option value="">Sin categoría</option>
          {visibleCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Descripción (opcional)</span>
        <input
          type="text"
          name="description"
          placeholder="Ej. Almuerzo, pase de bus…"
          className="rounded-lg border border-black/15 bg-transparent px-3 py-2.5 outline-none focus:border-emerald-500 dark:border-white/15"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Fecha</span>
        <input
          type="date"
          name="occurred_on"
          className="rounded-lg border border-black/15 bg-transparent px-3 py-2.5 outline-none focus:border-emerald-500 dark:border-white/15"
        />
      </label>

      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
      {state?.ok && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          ¡Movimiento guardado!
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Agregar"}
      </button>
    </form>
  );
}
