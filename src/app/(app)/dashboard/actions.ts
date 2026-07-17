"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Cierra la sesión y vuelve al login. */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export type TxFormState = { error?: string; ok?: boolean } | null;

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

type ResolvedSplit = {
  person_id: string;
  value: number;
  amount_resolved: number;
};

/**
 * Lee y valida la división (splits) del formulario. Devuelve las filas
 * resueltas (con el monto que le toca a cada persona) o un error.
 * Si no hay división, devuelve `{}`.
 */
async function buildSplitRows(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
  formData: FormData,
): Promise<{
  error?: string;
  mode?: "amount" | "percent";
  rows?: ResolvedSplit[];
}> {
  const mode = String(formData.get("split_mode") ?? "");
  if (mode !== "amount" && mode !== "percent") return {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(String(formData.get("splits") ?? "[]"));
  } catch {
    return { error: "Datos de división inválidos." };
  }
  if (!Array.isArray(parsed) || parsed.length === 0) return {};

  const items: { person_id: string; value: number }[] = [];
  for (const p of parsed) {
    const person_id = String((p as { person_id?: unknown })?.person_id ?? "");
    const value = Number((p as { value?: unknown })?.value);
    if (!person_id) return { error: "Elegí una persona en cada fila de la división." };
    if (!Number.isFinite(value) || value < 0) {
      return { error: "Los valores de la división deben ser números válidos." };
    }
    items.push({ person_id, value });
  }

  // Las personas deben pertenecer al usuario.
  const ids = [...new Set(items.map((i) => i.person_id))];
  const { data: owned } = await supabase
    .from("people")
    .select("id")
    .eq("user_id", userId)
    .in("id", ids);
  if (!owned || owned.length !== ids.length) {
    return { error: "Alguna persona seleccionada no es válida." };
  }

  const round2 = (n: number) => Math.round(n * 100) / 100;
  let rows: ResolvedSplit[];

  if (mode === "percent") {
    const sumPct = items.reduce((s, i) => s + i.value, 0);
    if (Math.abs(sumPct - 100) > 0.5) {
      return { error: `Los porcentajes deben sumar 100% (van ${sumPct}%).` };
    }
    rows = items.map((i) => ({
      person_id: i.person_id,
      value: i.value,
      amount_resolved: round2((amount * i.value) / 100),
    }));
  } else {
    const sumAmt = items.reduce((s, i) => s + i.value, 0);
    if (Math.abs(sumAmt - amount) > 1) {
      return {
        error: `Los montos de la división deben sumar el total (₡${amount}).`,
      };
    }
    rows = items.map((i) => ({
      person_id: i.person_id,
      value: i.value,
      amount_resolved: i.value,
    }));
  }

  // Ajuste de redondeo: la suma resuelta debe cuadrar exacto con el total.
  const sumResolved = round2(rows.reduce((s, r) => s + r.amount_resolved, 0));
  const diff = round2(amount - sumResolved);
  if (diff !== 0) {
    const last = rows[rows.length - 1];
    last.amount_resolved = round2(last.amount_resolved + diff);
  }

  return { mode, rows };
}

/** Registra un gasto o ingreso en `transactions`. */
export async function addTransaction(
  _prev: TxFormState,
  formData: FormData,
): Promise<TxFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Volvé a ingresar." };

  const kind = String(formData.get("kind") ?? "expense");
  const amount = Number(formData.get("amount"));
  const categoryId = formData.get("category_id");
  const description = String(formData.get("description") ?? "").trim();
  const occurredOn = String(formData.get("occurred_on") ?? "").trim();

  if (kind !== "expense" && kind !== "income") {
    return { error: "Tipo inválido." };
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "El monto debe ser mayor a 0." };
  }

  const split = await buildSplitRows(supabase, user.id, amount, formData);
  if (split.error) return { error: split.error };

  const currency = String(formData.get("currency") ?? "").trim() || "CRC";
  const occurredAt = String(formData.get("occurred_at") ?? "").trim() || null;

  const { data: inserted, error } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      kind,
      amount,
      currency,
      category_id: categoryId ? String(categoryId) : null,
      description: description || null,
      occurred_at: occurredAt,
      ...(occurredOn ? { occurred_on: occurredOn } : {}),
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { error: error?.message ?? "No se pudo guardar el movimiento." };
  }

  if (split.mode && split.rows) {
    const rows = split.rows.map((r) => ({
      transaction_id: inserted.id,
      person_id: r.person_id,
      split_mode: split.mode!,
      value: r.value,
      amount_resolved: r.amount_resolved,
    }));
    const { error: splitErr } = await supabase
      .from("transaction_splits")
      .insert(rows);
    if (splitErr) {
      // Evitar dejar la transacción sin su división: la borramos.
      await supabase
        .from("transactions")
        .delete()
        .eq("id", inserted.id)
        .eq("user_id", user.id);
      return { error: `No se pudo guardar la división: ${splitErr.message}` };
    }
  }

  revalidatePath("/dashboard");
  return { ok: true };
}

/** Actualiza un movimiento existente. */
export async function updateTransaction(
  _prev: TxFormState,
  formData: FormData,
): Promise<TxFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Volvé a ingresar." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Falta el identificador del movimiento." };

  // No editar aquí gastos de grupo: se manejan desde el grupo y su división es
  // entre miembros reales (editarlos acá borraría esos splits).
  const { data: existing } = await supabase
    .from("transactions")
    .select("group_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!existing) return { error: "No se encontró el movimiento." };
  if (existing.group_id) {
    return { error: "Los gastos de grupo se editan desde el grupo." };
  }

  const kind = String(formData.get("kind") ?? "expense");
  const amount = Number(formData.get("amount"));
  const categoryId = formData.get("category_id");
  const description = String(formData.get("description") ?? "").trim();
  const occurredOn = String(formData.get("occurred_on") ?? "").trim();

  if (kind !== "expense" && kind !== "income") {
    return { error: "Tipo inválido." };
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "El monto debe ser mayor a 0." };
  }

  const split = await buildSplitRows(supabase, user.id, amount, formData);
  if (split.error) return { error: split.error };

  const currency = String(formData.get("currency") ?? "").trim() || "CRC";
  const occurredAt = String(formData.get("occurred_at") ?? "").trim() || null;

  const { error } = await supabase
    .from("transactions")
    .update({
      kind,
      amount,
      currency,
      category_id: categoryId ? String(categoryId) : null,
      description: description || null,
      occurred_at: occurredAt,
      ...(occurredOn ? { occurred_on: occurredOn } : {}),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  // Reemplazar la división: borrar la anterior y (si hay) insertar la nueva.
  await supabase.from("transaction_splits").delete().eq("transaction_id", id);
  if (split.mode && split.rows) {
    const rows = split.rows.map((r) => ({
      transaction_id: id,
      person_id: r.person_id,
      split_mode: split.mode!,
      value: r.value,
      amount_resolved: r.amount_resolved,
    }));
    const { error: splitErr } = await supabase
      .from("transaction_splits")
      .insert(rows);
    if (splitErr) {
      return { error: `No se pudo guardar la división: ${splitErr.message}` };
    }
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

/** Borra un movimiento propio. */
export async function deleteTransaction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // RLS ya limita a lo propio; el filtro por user_id es defensa extra.
  await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/dashboard");
}
