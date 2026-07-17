"use client";

import { useActionState } from "react";
import { redeemCode, type PromoState } from "@/app/subscribe/actions";

export function PromoCodeForm() {
  const [state, action, pending] = useActionState<PromoState, FormData>(
    redeemCode,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Código promocional</span>
        <input
          type="text"
          name="code"
          required
          autoComplete="off"
          autoCapitalize="characters"
          placeholder="Ej. 123456"
          className="rounded-lg border border-black/15 bg-transparent px-3 py-2.5 text-center text-lg tracking-widest outline-none focus:border-emerald-500 dark:border-white/15"
        />
      </label>

      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "Validando…" : "Activar acceso"}
      </button>
    </form>
  );
}
