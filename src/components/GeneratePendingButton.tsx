"use client";

import { useActionState } from "react";
import {
  generatePending,
  type GenState,
} from "@/app/(app)/dashboard/recurring/actions";

export function GeneratePendingButton() {
  const [state, action, pending] = useActionState<GenState, FormData>(
    generatePending,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-1">
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-emerald-600/40 bg-emerald-600/10 px-4 py-2.5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-600/20 disabled:opacity-60 dark:text-emerald-400"
      >
        {pending ? "Generando…" : "Generar pendientes"}
      </button>
      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
      {typeof state?.created === "number" && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          {state.created === 0
            ? "No había movimientos pendientes."
            : `Se generaron ${state.created} movimiento(s).`}
        </p>
      )}
    </form>
  );
}
