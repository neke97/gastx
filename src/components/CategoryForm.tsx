"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addCategory, type CatFormState } from "@/app/(app)/dashboard/categories/actions";
import { CATEGORY_EMOJIS } from "@/lib/categoryIcons";

const PALETTE = [
  "#059669",
  "#10b981",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#06b6d4",
  "#64748b",
];

export function CategoryForm() {
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const [color, setColor] = useState(PALETTE[0]);
  const [icon, setIcon] = useState(CATEGORY_EMOJIS[0]);
  const [state, formAction, pending] = useActionState<CatFormState, FormData>(
    addCategory,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      setKind("expense");
      setColor(PALETTE[0]);
      setIcon(CATEGORY_EMOJIS[0]);
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.03]"
    >
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
          placeholder="Ej. Mascotas, Gimnasio…"
          className="rounded-lg border border-black/15 bg-transparent px-3 py-2.5 outline-none focus:border-emerald-500 dark:border-white/15"
        />
      </label>

      <div className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Color</span>
        <div className="flex flex-wrap gap-2">
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Color ${c}`}
              style={{ backgroundColor: c }}
              className={`h-7 w-7 rounded-full transition-transform ${
                color === c
                  ? "ring-2 ring-offset-2 ring-black/40 dark:ring-white/60 dark:ring-offset-neutral-900"
                  : "hover:scale-110"
              }`}
            />
          ))}
        </div>
      </div>
      <input type="hidden" name="color" value={color} />

      <div className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Ícono</span>
        <div className="grid max-h-32 grid-cols-8 gap-1 overflow-y-auto rounded-lg border border-black/10 p-2 dark:border-white/10">
          {CATEGORY_EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setIcon(e)}
              aria-label={`Ícono ${e}`}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-colors ${
                icon === e
                  ? "bg-blue-600/20 ring-2 ring-blue-500"
                  : "hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
      <input type="hidden" name="icon" value={icon} />

      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Agregar categoría"}
      </button>
    </form>
  );
}
