"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import {
  addTransaction,
  updateTransaction,
  type TxFormState,
} from "@/app/(app)/dashboard/actions";

type Category = { id: string; name: string; kind: "expense" | "income" };

type Initial = {
  id: string;
  kind: "expense" | "income";
  amount: number;
  category_id: string | null;
  description: string | null;
  occurred_on: string;
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

export function TransactionForm({
  categories,
  initial,
}: {
  categories: Category[];
  initial?: Initial;
}) {
  const isEdit = Boolean(initial);
  const today = toYMD(new Date());
  const yesterday = toYMD(new Date(Date.now() - 86_400_000));

  const [kind, setKind] = useState<"expense" | "income">(
    initial?.kind ?? "expense",
  );
  const [date, setDate] = useState(initial?.occurred_on ?? today);

  const [state, formAction, pending] = useActionState<TxFormState, FormData>(
    isEdit ? updateTransaction : addTransaction,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Al crear con éxito, limpiar y volver a "hoy". (En edición redirige al dashboard.)
  useEffect(() => {
    if (state?.ok && !isEdit) {
      formRef.current?.reset();
      setKind("expense");
      setDate(today);
    }
  }, [state, isEdit, today]);

  const visibleCategories = categories.filter((c) => c.kind === kind);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.03]"
    >
      {isEdit && <input type="hidden" name="id" value={initial!.id} />}

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
          defaultValue={initial?.amount ?? ""}
          className={inputClasses}
        />
      </label>

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
          defaultValue={initial?.description ?? ""}
          className={inputClasses}
        />
      </label>

      <div className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Fecha</span>
        <div className="flex gap-2">
          <input
            type="date"
            name="occurred_on"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={`flex-1 ${selectClasses}`}
          />
          <button
            type="button"
            onClick={() => setDate(today)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              date === today
                ? "bg-emerald-600 text-white"
                : "border border-black/15 dark:border-white/15"
            }`}
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => setDate(yesterday)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              date === yesterday
                ? "bg-emerald-600 text-white"
                : "border border-black/15 dark:border-white/15"
            }`}
          >
            Ayer
          </button>
        </div>
      </div>

      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
      {state?.ok && !isEdit && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          ¡Movimiento guardado!
        </p>
      )}

      <div className="mt-1 flex gap-2">
        {isEdit && (
          <Link
            href="/dashboard"
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
          {pending
            ? "Guardando…"
            : isEdit
              ? "Guardar cambios"
              : "Agregar"}
        </button>
      </div>
    </form>
  );
}
