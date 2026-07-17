"use client";

import { useActionState } from "react";
import { createGroup, type GroupFormState } from "@/app/(app)/dashboard/groups/actions";

export function CreateGroupForm() {
  const [state, action, pending] = useActionState<GroupFormState, FormData>(
    createGroup,
    null,
  );

  return (
    <form action={action} className="flex gap-2">
      <input
        type="text"
        name="name"
        required
        placeholder="Nombre del grupo (ej. Casa, Viaje…)"
        className="flex-1 rounded-lg border border-black/15 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-white/15"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "Creando…" : "Crear"}
      </button>
      {state?.error && (
        <p className="w-full text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
    </form>
  );
}
