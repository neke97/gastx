"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type RecFormState = { error?: string; ok?: boolean } | null;
export type GenState = { created?: number; error?: string } | null;

const FREQS = ["daily", "weekly", "monthly", "yearly"] as const;

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function toYMD(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function todayYMD() {
  return toYMD(new Date());
}

/** Avanza una fecha (YYYY-MM-DD) según la frecuencia e intervalo. */
function addPeriod(ymd: string, frequency: string, interval: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (frequency === "daily") date.setDate(date.getDate() + interval);
  else if (frequency === "weekly") date.setDate(date.getDate() + interval * 7);
  else if (frequency === "monthly") date.setMonth(date.getMonth() + interval);
  else if (frequency === "yearly")
    date.setFullYear(date.getFullYear() + interval);
  return toYMD(date);
}

function revalidate() {
  revalidatePath("/dashboard/recurring");
  revalidatePath("/dashboard");
}

/** Lee y valida los campos comunes del formulario de recurrente. */
function parseForm(formData: FormData):
  | { error: string }
  | {
      kind: "expense" | "income";
      name: string;
      amount: number;
      currency: string;
      categoryId: string | null;
      frequency: (typeof FREQS)[number];
      interval: number;
      nextRunOn: string;
    } {
  const kind = String(formData.get("kind") ?? "expense");
  const name = String(formData.get("name") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const currency = String(formData.get("currency") ?? "").trim() || "CRC";
  const categoryId = formData.get("category_id");
  const frequency = String(formData.get("frequency") ?? "monthly");
  const interval = Number(formData.get("interval") ?? 1);
  const nextRunOn = String(formData.get("next_run_on") ?? "").trim();

  if (kind !== "expense" && kind !== "income") return { error: "Tipo inválido." };
  if (!name) return { error: "Escribí un nombre." };
  if (!Number.isFinite(amount) || amount <= 0)
    return { error: "El monto debe ser mayor a 0." };
  if (!FREQS.includes(frequency as (typeof FREQS)[number]))
    return { error: "Frecuencia inválida." };
  if (!Number.isInteger(interval) || interval < 1)
    return { error: "El intervalo debe ser un entero ≥ 1." };
  if (!nextRunOn) return { error: "Elegí la próxima fecha." };

  return {
    kind,
    name,
    amount,
    currency,
    categoryId: categoryId ? String(categoryId) : null,
    frequency: frequency as (typeof FREQS)[number],
    interval,
    nextRunOn,
  };
}

/** Crea una recurrente + su primer registro de historial de precio. */
export async function addRecurring(
  _prev: RecFormState,
  formData: FormData,
): Promise<RecFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Volvé a ingresar." };

  const p = parseForm(formData);
  if ("error" in p) return { error: p.error };

  const { data: inserted, error } = await supabase
    .from("recurring_templates")
    .insert({
      user_id: user.id,
      kind: p.kind,
      name: p.name,
      amount: p.amount,
      currency: p.currency,
      category_id: p.categoryId,
      frequency: p.frequency,
      interval: p.interval,
      next_run_on: p.nextRunOn,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { error: error?.message ?? "No se pudo crear la recurrente." };
  }

  await supabase.from("recurring_amount_history").insert({
    recurring_template_id: inserted.id,
    amount: p.amount,
    effective_from: p.nextRunOn,
  });

  revalidate();
  return { ok: true };
}

/** Edita una recurrente. Si cambia el monto, guarda una entrada de historial. */
export async function updateRecurring(
  _prev: RecFormState,
  formData: FormData,
): Promise<RecFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Volvé a ingresar." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Falta el identificador." };

  const p = parseForm(formData);
  if ("error" in p) return { error: p.error };

  const { data: current } = await supabase
    .from("recurring_templates")
    .select("amount")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!current) return { error: "No se encontró la recurrente." };

  const { error } = await supabase
    .from("recurring_templates")
    .update({
      kind: p.kind,
      name: p.name,
      amount: p.amount,
      currency: p.currency,
      category_id: p.categoryId,
      frequency: p.frequency,
      interval: p.interval,
      next_run_on: p.nextRunOn,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  // Si el precio cambió, dejamos constancia en el historial (desde hoy).
  if (Number(current.amount) !== p.amount) {
    await supabase.from("recurring_amount_history").insert({
      recurring_template_id: id,
      amount: p.amount,
      effective_from: todayYMD(),
    });
  }

  revalidate();
  redirect("/dashboard/recurring");
}

/**
 * Atajo: registra AHORA (fecha de hoy) un movimiento a partir de una plantilla,
 * sin tocar la programación (next_run_on). Es el "tocar para sumar".
 */
export async function quickAddFromTemplate(formData: FormData) {
  const id = String(formData.get("template_id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: t } = await supabase
    .from("recurring_templates")
    .select("kind, amount, currency, category_id, name")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!t) return;

  await supabase.from("transactions").insert({
    user_id: user.id,
    kind: t.kind,
    amount: t.amount,
    currency: t.currency,
    category_id: t.category_id,
    description: t.name,
    occurred_on: todayYMD(),
    recurring_template_id: id,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/recurring");
}

/** Activa o pausa una recurrente. */
export async function toggleActiveRecurring(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("recurring_templates")
    .update({ is_active: active })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidate();
}

/** Borra una recurrente (las transacciones ya generadas se conservan). */
export async function deleteRecurring(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("recurring_templates")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  revalidate();
}

/**
 * Genera las transacciones pendientes de todas las recurrentes activas
 * cuya próxima fecha ya llegó (se ponen al día periodo por periodo).
 */
export async function generatePending(
  _prev: GenState,
  _formData: FormData,
): Promise<GenState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Volvé a ingresar." };

  const today = todayYMD();
  const { data: templates } = await supabase
    .from("recurring_templates")
    .select("*")
    .eq("is_active", true)
    .lte("next_run_on", today);

  if (!templates || templates.length === 0) return { created: 0 };

  let created = 0;
  for (const t of templates) {
    let runOn: string = t.next_run_on;
    const toInsert: Record<string, unknown>[] = [];
    let guard = 0;
    while (runOn <= today && guard < 400) {
      toInsert.push({
        user_id: user.id,
        kind: t.kind,
        amount: t.amount,
        currency: t.currency,
        category_id: t.category_id,
        description: t.name,
        occurred_on: runOn,
        recurring_template_id: t.id,
      });
      runOn = addPeriod(runOn, t.frequency, t.interval);
      guard++;
    }
    if (toInsert.length > 0) {
      const { error } = await supabase.from("transactions").insert(toInsert);
      if (error) return { error: error.message };
      created += toInsert.length;
      await supabase
        .from("recurring_templates")
        .update({ next_run_on: runOn })
        .eq("id", t.id)
        .eq("user_id", user.id);
    }
  }

  revalidate();
  return { created };
}
