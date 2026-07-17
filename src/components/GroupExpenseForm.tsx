"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  addGroupExpense,
  type GroupFormState,
} from "@/app/(app)/dashboard/groups/actions";

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function todayYMD() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const inputClasses =
  "rounded-lg border border-black/15 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-white/15";

export function GroupExpenseForm({
  groupId,
  memberCount,
  currency = "CRC",
}: {
  groupId: string;
  memberCount: number;
  currency?: string;
}) {
  const [state, action, pending] = useActionState<GroupFormState, FormData>(
    addGroupExpense,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.03]"
    >
      <input type="hidden" name="group_id" value={groupId} />

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Monto del gasto ({currency})</span>
        <input
          type="number"
          name="amount"
          required
          min="0"
          step="0.01"
          inputMode="decimal"
          placeholder="0"
          className={inputClasses}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Descripción (opcional)</span>
        <input
          type="text"
          name="description"
          placeholder="Ej. Supermercado, cena…"
          className={inputClasses}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Fecha</span>
        <input
          type="date"
          name="occurred_on"
          defaultValue={todayYMD()}
          className={`${inputClasses} bg-white text-black dark:bg-neutral-900 dark:text-white`}
        />
      </label>

      <p className="text-xs text-black/50 dark:text-white/50">
        Lo pagás vos y se divide en partes iguales entre los {memberCount}{" "}
        miembros.
      </p>

      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
      {state?.ok && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          ¡Gasto agregado!
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "Agregando…" : "Agregar gasto del grupo"}
      </button>
    </form>
  );
}
