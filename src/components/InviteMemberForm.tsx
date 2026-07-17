"use client";

import { useActionState, useEffect, useRef } from "react";
import { inviteToGroup, type GroupFormState } from "@/app/(app)/dashboard/groups/actions";

export function InviteMemberForm({ groupId }: { groupId: string }) {
  const [state, action, pending] = useActionState<GroupFormState, FormData>(
    inviteToGroup,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-2">
      <input type="hidden" name="group_id" value={groupId} />
      <div className="flex gap-2">
        <input
          type="email"
          name="email"
          required
          placeholder="correo@ejemplo.com"
          className="flex-1 rounded-lg border border-black/15 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-white/15"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
        >
          {pending ? "Invitando…" : "Invitar"}
        </button>
      </div>
      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
      {state?.ok && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          Invitación enviada. La verá al iniciar sesión con ese correo.
        </p>
      )}
    </form>
  );
}
