"use client";

import { Busy } from "@/components/Spinner";
import { useActionState, useEffect } from "react";
import {
  generatePending,
  type GenState,
} from "@/app/(app)/dashboard/recurring/actions";
import { toast } from "@/components/Toaster";
import { Icon } from "@/components/Icon";

/** Genera los movimientos automáticos que quedaron pendientes; avisa con un toast. */
export function GeneratePendingButton() {
  const [state, action, pending] = useActionState<GenState, FormData>(
    generatePending,
    null,
  );

  useEffect(() => {
    if (state?.error) toast(state.error, "error");
    else if (typeof state?.created === "number") {
      toast(
        state.created === 0
          ? "Todo al día, no había pendientes"
          : `Se generaron ${state.created} movimiento(s)`,
      );
    }
  }, [state]);

  return (
    <form action={action}>
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        title="Generar los movimientos automáticos pendientes"
        className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/15 px-3.5 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/25 disabled:opacity-60 dark:text-emerald-400"
      >
        <Icon name="sparkles" size={15} />
        {pending ? <Busy label="Generando…" /> : "Generar"}
      </button>
    </form>
  );
}
