"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import {
  addTransaction,
  updateTransaction,
  type TxFormState,
} from "@/app/(app)/dashboard/actions";
import { formatMoney } from "@/lib/format";

type Category = { id: string; name: string; kind: "expense" | "income" };
type Person = { id: string; name: string };

type Initial = {
  id: string;
  kind: "expense" | "income";
  amount: number;
  category_id: string | null;
  description: string | null;
  occurred_on: string;
  currency?: string;
};

type SplitRow = { id: number; personId: string; value: string };
type InitialSplit = {
  person_id: string;
  split_mode: "amount" | "percent";
  value: number;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function toYMD(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function round2(n: number) {
  return Math.round(n * 100) / 100;
}

const selectClasses =
  "rounded-lg border border-black/15 bg-white px-3 py-2.5 text-black outline-none focus:border-emerald-500 dark:border-white/15 dark:bg-neutral-900 dark:text-white";
const inputClasses =
  "rounded-lg border border-black/15 bg-transparent px-3 py-2.5 outline-none focus:border-emerald-500 dark:border-white/15";

export function TransactionForm({
  categories,
  people = [],
  initial,
  initialSplits = [],
  baseCurrency = "CRC",
  currencies = ["CRC"],
}: {
  categories: Category[];
  people?: Person[];
  initial?: Initial;
  initialSplits?: InitialSplit[];
  baseCurrency?: string;
  currencies?: string[];
}) {
  const isEdit = Boolean(initial);
  const today = toYMD(new Date());
  const yesterday = toYMD(new Date(Date.now() - 86_400_000));

  const [kind, setKind] = useState<"expense" | "income">(
    initial?.kind ?? "expense",
  );
  const [amount, setAmount] = useState(
    initial?.amount != null ? String(initial.amount) : "",
  );
  const [date, setDate] = useState(initial?.occurred_on ?? today);

  // División (crear o editar). En edición se precarga desde initialSplits.
  const [splitOn, setSplitOn] = useState(initialSplits.length > 0);
  const [splitMode, setSplitMode] = useState<"amount" | "percent">(
    initialSplits[0]?.split_mode ?? "amount",
  );
  const nextId = useRef(initialSplits.length + 1);
  const [rows, setRows] = useState<SplitRow[]>(
    initialSplits.map((s, i) => ({
      id: i + 1,
      personId: s.person_id,
      value: String(s.value),
    })),
  );

  const [state, formAction, pending] = useActionState<TxFormState, FormData>(
    isEdit ? updateTransaction : addTransaction,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok && !isEdit) {
      formRef.current?.reset();
      setKind("expense");
      setAmount("");
      setDate(today);
      setSplitOn(false);
      setRows([]);
    }
  }, [state, isEdit, today]);

  const visibleCategories = categories.filter((c) => c.kind === kind);
  const amountNum = Number(amount) || 0;

  const addRow = () =>
    setRows((r) => [
      ...r,
      { id: nextId.current++, personId: people[0]?.id ?? "", value: "" },
    ]);
  const removeRow = (id: number) =>
    setRows((r) => r.filter((x) => x.id !== id));
  const setRow = (id: number, patch: Partial<SplitRow>) =>
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const splitEqually = () => {
    const n = rows.length;
    if (n === 0) return;
    const total = splitMode === "percent" ? 100 : amountNum;
    const base = Math.floor((total / n) * 100) / 100;
    setRows((r) =>
      r.map((row, i) => ({
        ...row,
        value: String(i === n - 1 ? round2(total - base * (n - 1)) : base),
      })),
    );
  };

  const assigned = round2(rows.reduce((s, r) => s + (Number(r.value) || 0), 0));
  const target = splitMode === "percent" ? 100 : amountNum;
  const remaining = round2(target - assigned);
  const splitValid = splitOn && rows.length > 0 && Math.abs(remaining) < 0.5;

  const splitsPayload = JSON.stringify(
    rows
      .filter((r) => r.personId)
      .map((r) => ({ person_id: r.personId, value: Number(r.value) || 0 })),
  );

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.03]"
    >
      {isEdit && <input type="hidden" name="id" value={initial!.id} />}

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

      <div className="flex gap-2">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span className="font-medium">Monto</span>
          <input
            type="number"
            name="amount"
            required
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={inputClasses}
          />
        </label>
        {currencies.length > 1 ? (
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Moneda</span>
            <select
              name="currency"
              defaultValue={initial?.currency ?? baseCurrency}
              className={selectClasses}
            >
              {currencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <input type="hidden" name="currency" value={baseCurrency} />
        )}
      </div>

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
                ? "bg-blue-600 text-white"
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
                ? "bg-blue-600 text-white"
                : "border border-black/15 dark:border-white/15"
            }`}
          >
            Ayer
          </button>
        </div>
      </div>

      {/* ---- División entre personas (crear o editar) ---- */}
      <div className="flex flex-col gap-2 rounded-xl border border-black/10 p-3 dark:border-white/10">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={splitOn}
              onChange={(e) => {
                setSplitOn(e.target.checked);
                if (e.target.checked && rows.length === 0) addRow();
              }}
              className="h-4 w-4 accent-emerald-600"
            />
            Dividir entre personas
          </label>

          {splitOn && people.length === 0 && (
            <p className="text-sm text-black/60 dark:text-white/60">
              No tenés personas.{" "}
              <Link href="/dashboard/people" className="text-emerald-600 underline dark:text-emerald-400">
                Agregá alguna primero
              </Link>
              .
            </p>
          )}

          {splitOn && people.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-2">
                {(["amount", "percent"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSplitMode(m)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      splitMode === m
                        ? "bg-blue-600 text-white"
                        : "border border-black/15 dark:border-white/15"
                    }`}
                  >
                    {m === "amount" ? "Por monto" : "Por %"}
                  </button>
                ))}
              </div>

              {rows.map((row) => {
                const resolved =
                  splitMode === "percent"
                    ? round2((amountNum * (Number(row.value) || 0)) / 100)
                    : Number(row.value) || 0;
                return (
                  <div
                    key={row.id}
                    className="flex flex-col gap-2 rounded-lg border border-black/10 p-2.5 dark:border-white/10"
                  >
                    {/* Persona: a todo el ancho para que se lea completo */}
                    <select
                      value={row.personId}
                      onChange={(e) => setRow(row.id, { personId: e.target.value })}
                      className={`w-full ${selectClasses} py-2`}
                    >
                      {people.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    {/* Monto/%, equivalente y quitar */}
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        placeholder={splitMode === "percent" ? "%" : "₡"}
                        value={row.value}
                        onChange={(e) => setRow(row.id, { value: e.target.value })}
                        className={`w-28 ${inputClasses} py-2`}
                      />
                      <span className="flex-1 text-xs text-black/50 dark:text-white/50">
                        {splitMode === "percent" ? `= ${formatMoney(resolved)}` : ""}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeRow(row.id)}
                        aria-label="Quitar persona"
                        title="Quitar"
                        className="rounded-md px-2 py-1 text-black/40 hover:bg-red-500/10 hover:text-red-600 dark:text-white/40 dark:hover:text-red-400"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}

              <div className="flex items-center justify-between gap-2 text-sm">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={addRow}
                    className="rounded-lg border border-black/15 px-3 py-1.5 text-sm transition-colors hover:bg-black/[0.04] dark:border-white/15 dark:hover:bg-white/[0.06]"
                  >
                    + Persona
                  </button>
                  <button
                    type="button"
                    onClick={splitEqually}
                    className="rounded-lg border border-black/15 px-3 py-1.5 text-sm transition-colors hover:bg-black/[0.04] dark:border-white/15 dark:hover:bg-white/[0.06]"
                  >
                    Repartir igual
                  </button>
                </div>
                <span
                  className={
                    Math.abs(remaining) < 0.5
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }
                >
                  {splitMode === "percent"
                    ? `Falta ${remaining}%`
                    : `Falta ${formatMoney(remaining)}`}
                </span>
              </div>

              <input
                type="hidden"
                name="split_mode"
                value={splitValid ? splitMode : ""}
              />
              <input type="hidden" name="splits" value={splitsPayload} />
            </>
          )}
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
          disabled={pending || (splitOn && people.length > 0 && !splitValid)}
          className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
        >
          {pending ? "Guardando…" : isEdit ? "Guardar cambios" : "Agregar"}
        </button>
      </div>
    </form>
  );
}
