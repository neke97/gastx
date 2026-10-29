"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import {
  addTransaction,
  updateTransaction,
  type TxFormState,
} from "@/app/(app)/dashboard/actions";
import { formatMoney } from "@/lib/format";
import { categoryIcon } from "@/lib/categoryIcons";
import { toast } from "@/components/Toaster";

type Category = {
  id: string;
  name: string;
  kind: "expense" | "income";
  icon?: string | null;
};
type Person = { id: string; name: string };

type Initial = {
  id: string;
  kind: "expense" | "income";
  amount: number;
  category_id: string | null;
  description: string | null;
  occurred_on: string;
  occurred_at?: string | null;
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
/** HH:MM (zona CR) desde un ISO, para precargar la hora al editar. */
function isoToHHMM(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("es-CR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Costa_Rica",
  }).format(d);
}
/** Símbolo de la moneda (₡, $, €…) para mostrar junto al monto. */
function currencySymbol(code: string) {
  try {
    return (
      new Intl.NumberFormat("es-CR", { style: "currency", currency: code })
        .formatToParts(0)
        .find((p) => p.type === "currency")?.value ?? code
    );
  } catch {
    return code;
  }
}

const fieldClasses =
  "w-full rounded-xl border border-black/10 bg-black/[0.03] px-3.5 py-3 text-[15px] text-black outline-none transition-colors placeholder:text-black/35 focus:border-emerald-500 focus:bg-white dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:placeholder:text-white/35 dark:focus:bg-white/[0.08]";
const chipBase =
  "rounded-full px-3.5 py-2 text-sm font-medium transition-colors";
const chipIdle =
  "bg-black/[0.04] text-black/70 hover:bg-black/[0.07] dark:bg-white/[0.06] dark:text-white/75";

export function TransactionForm({
  categories,
  people = [],
  initial,
  initialSplits = [],
  baseCurrency = "CRC",
  currencies = ["CRC"],
  onSaved,
}: {
  categories: Category[];
  people?: Person[];
  initial?: Initial;
  initialSplits?: InitialSplit[];
  baseCurrency?: string;
  currencies?: string[];
  /** Se llama tras guardar un movimiento nuevo (ej. para cerrar la hoja). */
  onSaved?: () => void;
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
  const [currency, setCurrency] = useState(initial?.currency ?? baseCurrency);
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? "");
  const [date, setDate] = useState(initial?.occurred_on ?? today);
  const [time, setTime] = useState(
    initial?.occurred_at ? isoToHHMM(initial.occurred_at) : "",
  );

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
      toast(kind === "expense" ? "Gasto agregado" : "Ingreso agregado");
      formRef.current?.reset();
      setKind("expense");
      setAmount("");
      setCategoryId("");
      setDate(today);
      setTime("");
      setSplitOn(false);
      setRows([]);
      onSaved?.();
    }
    if (state?.error) toast(state.error, "error");
    // Solo reaccionar a un resultado nuevo de la acción.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const visibleCategories = categories.filter((c) => c.kind === kind);
  const amountNum = Number(amount) || 0;

  // Al editar, preservar la moneda original aunque ya no tenga tasa configurada.
  const effectiveCurrencies = [
    ...new Set([
      ...currencies,
      ...(initial?.currency ? [initial.currency] : []),
    ]),
  ];

  // Fecha+hora como instante ISO (si hay hora). Vacío = solo fecha.
  const occurredAtIso = (() => {
    if (!time || !date) return "";
    const d = new Date(`${date}T${time}`);
    return isNaN(d.getTime()) ? "" : d.toISOString();
  })();

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

  const isExpense = kind === "expense";
  const accentText = isExpense
    ? "text-rose-600 dark:text-rose-400"
    : "text-emerald-600 dark:text-emerald-400";

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-5">
      {isEdit && <input type="hidden" name="id" value={initial!.id} />}

      {/* Gasto / Ingreso (control segmentado) */}
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-black/[0.05] p-1 dark:bg-white/[0.07]">
        {(["expense", "income"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              setKind(k);
              // La categoría elegida es de otro tipo: se limpia.
              setCategoryId("");
              // La división solo aplica a gastos.
              if (k === "income") setSplitOn(false);
            }}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
              kind === k
                ? `bg-white shadow-sm dark:bg-white/15 ${
                    k === "expense"
                      ? "text-rose-600 dark:text-rose-300"
                      : "text-emerald-600 dark:text-emerald-300"
                  }`
                : "text-black/50 dark:text-white/50"
            }`}
          >
            {k === "expense" ? "↓ Gasto" : "↑ Ingreso"}
          </button>
        ))}
      </div>
      <input type="hidden" name="kind" value={kind} />

      {/* Monto grande */}
      <div className="flex flex-col items-center gap-2">
        <label className="flex w-full items-baseline justify-center gap-1">
          <span className={`text-3xl font-semibold ${accentText}`}>
            {currencySymbol(currency)}
          </span>
          <input
            type="number"
            name="amount"
            required
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="0"
            aria-label="Monto"
            autoFocus={!isEdit}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            // Ancho según lo escrito: el símbolo queda pegado al número.
            style={{ width: `${Math.min(10, Math.max(1, amount.length)) + 0.6}ch` }}
            className={`bg-transparent text-center text-5xl font-bold tracking-tight outline-none placeholder:text-black/15 dark:placeholder:text-white/15 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none ${accentText}`}
          />
        </label>
        {effectiveCurrencies.length > 1 ? (
          <div className="flex gap-1.5">
            {effectiveCurrencies.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  currency === c
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : chipIdle
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        ) : null}
        <input type="hidden" name="currency" value={currency} />
      </div>

      {/* Categoría como chips */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-black/45 dark:text-white/45">
          Categoría
        </span>
        {visibleCategories.length === 0 ? (
          <p className="text-sm text-black/50 dark:text-white/50">
            No tenés categorías de {isExpense ? "gasto" : "ingreso"}.{" "}
            <Link href="/dashboard/categories" className="font-medium text-emerald-600 underline dark:text-emerald-400">
              Crear una
            </Link>
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {visibleCategories.map((c) => {
              const selected = categoryId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setCategoryId(selected ? "" : c.id)}
                  className={`${chipBase} flex items-center gap-1.5 ${
                    selected
                      ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                      : chipIdle
                  }`}
                >
                  <span aria-hidden>{categoryIcon(c.icon)}</span>
                  {c.name}
                </button>
              );
            })}
          </div>
        )}
        <input type="hidden" name="category_id" value={categoryId} />
      </div>

      <input
        type="text"
        name="description"
        placeholder="Descripción (opcional) · Ej. Almuerzo"
        aria-label="Descripción (opcional)"
        defaultValue={initial?.description ?? ""}
        className={fieldClasses}
      />

      {/* Fecha */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-black/45 dark:text-white/45">
          Cuándo
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {[
            { label: "Hoy", value: today },
            { label: "Ayer", value: yesterday },
          ].map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => setDate(opt.value)}
              className={`${chipBase} ${
                date === opt.value
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : chipIdle
              }`}
            >
              {opt.label}
            </button>
          ))}
          <input
            type="date"
            name="occurred_on"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Fecha"
            className={`${chipBase} ${
              date !== today && date !== yesterday
                ? "bg-black text-white dark:bg-white dark:text-black"
                : chipIdle
            } outline-none`}
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            aria-label="Hora (opcional)"
            title="Hora (opcional)"
            className={`${chipBase} ${chipIdle} outline-none`}
          />
        </div>
        <input type="hidden" name="occurred_at" value={occurredAtIso} />
      </div>

      {/* ---- División entre personas (solo gastos) ---- */}
      {isExpense && (
        <div className="flex flex-col gap-3 rounded-2xl bg-black/[0.03] p-3.5 dark:bg-white/[0.04]">
          <label className="flex items-center justify-between gap-2 text-sm font-medium">
            <span>👥 Dividir entre personas</span>
            <input
              type="checkbox"
              role="switch"
              checked={splitOn}
              onChange={(e) => {
                setSplitOn(e.target.checked);
                if (e.target.checked && rows.length === 0) addRow();
              }}
              className="relative h-6 w-10 cursor-pointer appearance-none rounded-full bg-black/15 transition-colors before:absolute before:left-0.5 before:top-0.5 before:h-5 before:w-5 before:rounded-full before:bg-white before:shadow before:transition-transform checked:bg-emerald-600 checked:before:translate-x-4 dark:bg-white/20"
            />
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
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-black/[0.05] p-1 dark:bg-white/[0.07]">
                {(["amount", "percent"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSplitMode(m)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                      splitMode === m
                        ? "bg-white shadow-sm dark:bg-white/15"
                        : "text-black/50 dark:text-white/50"
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
                  <div key={row.id} className="flex items-center gap-2">
                    <select
                      value={row.personId}
                      onChange={(e) => setRow(row.id, { personId: e.target.value })}
                      className={`min-w-0 flex-1 ${fieldClasses} py-2.5`}
                    >
                      {people.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex w-28 flex-col">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        placeholder={splitMode === "percent" ? "%" : currencySymbol(currency)}
                        value={row.value}
                        onChange={(e) => setRow(row.id, { value: e.target.value })}
                        className={`${fieldClasses} py-2.5`}
                      />
                      {splitMode === "percent" && (
                        <span className="mt-0.5 text-[11px] text-black/45 dark:text-white/45">
                          = {formatMoney(resolved, currency)}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      aria-label="Quitar persona"
                      title="Quitar"
                      className="rounded-full p-2 text-black/40 hover:bg-red-500/10 hover:text-red-600 dark:text-white/40 dark:hover:text-red-400"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}

              <div className="flex items-center justify-between gap-2 text-sm">
                <div className="flex gap-2">
                  <button type="button" onClick={addRow} className={`${chipBase} ${chipIdle} py-1.5`}>
                    + Persona
                  </button>
                  <button type="button" onClick={splitEqually} className={`${chipBase} ${chipIdle} py-1.5`}>
                    Repartir igual
                  </button>
                </div>
                <span
                  className={`text-xs font-medium ${
                    Math.abs(remaining) < 0.5
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {Math.abs(remaining) < 0.5
                    ? "✓ Cuadra"
                    : splitMode === "percent"
                      ? `Falta ${remaining}%`
                      : `Falta ${formatMoney(remaining, currency)}`}
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
      )}

      {state?.error && (
        <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        {isEdit && (
          <Link
            href="/dashboard"
            className="flex-1 rounded-2xl border border-black/10 px-4 py-3.5 text-center font-semibold dark:border-white/15"
          >
            Cancelar
          </Link>
        )}
        <button
          type="submit"
          disabled={
            pending ||
            (isExpense && splitOn && people.length > 0 && !splitValid)
          }
          className={`flex-1 rounded-2xl px-4 py-3.5 font-semibold text-white shadow-lg transition-colors disabled:opacity-50 ${
            isExpense
              ? "bg-rose-600 shadow-rose-600/25 hover:bg-rose-700"
              : "bg-emerald-600 shadow-emerald-600/25 hover:bg-emerald-700"
          }`}
        >
          {pending
            ? "Guardando…"
            : isEdit
              ? "Guardar"
              : `Agregar ${isExpense ? "gasto" : "ingreso"}${amountNum > 0 ? ` de ${formatMoney(amountNum, currency)}` : ""}`}
        </button>
      </div>
    </form>
  );
}
