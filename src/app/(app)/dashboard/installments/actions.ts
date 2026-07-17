"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type PlanFormState = { error?: string; ok?: boolean } | null;

const FREQS = ["weekly", "monthly", "yearly"] as const;

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function toYMD(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function todayYMD() {
  return toYMD(new Date());
}
function round2(n: number) {
  return Math.round(n * 100) / 100;
}
function addPeriod(ymd: string, frequency: string, times: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (frequency === "weekly") date.setDate(date.getDate() + 7 * times);
  else if (frequency === "yearly") date.setFullYear(date.getFullYear() + times);
  else date.setMonth(date.getMonth() + times); // monthly (default)
  return toYMD(date);
}

function revalidate(planId?: string) {
  revalidatePath("/dashboard/installments");
  if (planId) revalidatePath(`/dashboard/installments/${planId}`);
  revalidatePath("/dashboard");
}

/** Crea un plan de cuotas y genera sus pagos (1..N). */
export async function addPlan(
  _prev: PlanFormState,
  formData: FormData,
): Promise<PlanFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Volvé a ingresar." };

  const name = String(formData.get("name") ?? "").trim();
  const total = Number(formData.get("total_amount"));
  const count = Number(formData.get("installments_count"));
  const categoryId = formData.get("category_id");
  const startDate = String(formData.get("start_date") ?? "").trim();
  const frequency = String(formData.get("frequency") ?? "monthly");
  const currency = String(formData.get("currency") ?? "").trim() || "CRC";

  if (!name) return { error: "Escribí un nombre." };
  if (!Number.isFinite(total) || total <= 0)
    return { error: "El total debe ser mayor a 0." };
  if (!Number.isInteger(count) || count < 1)
    return { error: "El número de cuotas debe ser un entero ≥ 1." };
  if (!startDate) return { error: "Elegí la fecha de la primera cuota." };
  if (!FREQS.includes(frequency as (typeof FREQS)[number]))
    return { error: "Frecuencia inválida." };

  const perInstallment = round2(total / count);

  const { data: plan, error } = await supabase
    .from("installment_plans")
    .insert({
      user_id: user.id,
      name,
      total_amount: total,
      installments_count: count,
      installment_amount: perInstallment,
      currency,
      category_id: categoryId ? String(categoryId) : null,
      start_date: startDate,
      frequency,
    })
    .select("id")
    .single();

  if (error || !plan) {
    return { error: error?.message ?? "No se pudo crear el plan." };
  }

  // Generar las cuotas; la última ajusta el redondeo para cuadrar el total.
  const payments = [];
  let accumulated = 0;
  for (let i = 0; i < count; i++) {
    const isLast = i === count - 1;
    const amount = isLast ? round2(total - accumulated) : perInstallment;
    accumulated = round2(accumulated + amount);
    payments.push({
      installment_plan_id: plan.id,
      number: i + 1,
      due_date: addPeriod(startDate, frequency, i),
      amount,
    });
  }

  const { error: payErr } = await supabase
    .from("installment_payments")
    .insert(payments);
  if (payErr) {
    await supabase
      .from("installment_plans")
      .delete()
      .eq("id", plan.id)
      .eq("user_id", user.id);
    return { error: `No se pudieron crear las cuotas: ${payErr.message}` };
  }

  revalidate();
  return { ok: true };
}

/** Edita datos del plan (nombre y categoría). No regenera las cuotas. */
export async function updatePlanInfo(formData: FormData) {
  const id = String(formData.get("plan_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const categoryId = formData.get("category_id");
  if (!id || !name) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("installment_plans")
    .update({ name, category_id: categoryId ? String(categoryId) : null })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidate(id);
}

/** Marca una cuota como pagada y la registra como gasto. */
export async function payInstallment(formData: FormData) {
  const paymentId = String(formData.get("payment_id") ?? "");
  if (!paymentId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: payment } = await supabase
    .from("installment_payments")
    .select(
      "id, number, amount, paid_on, due_date, installment_plan_id, installment_plans(name, installments_count, category_id, currency)",
    )
    .eq("id", paymentId)
    .maybeSingle();

  if (!payment || payment.paid_on) return; // no existe o ya pagada

  const plan = payment.installment_plans as unknown as {
    name: string;
    installments_count: number;
    category_id: string | null;
    currency: string;
  };

  const { data: tx, error: txErr } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      kind: "expense",
      amount: payment.amount,
      currency: plan.currency,
      category_id: plan.category_id,
      description: `${plan.name} — cuota ${payment.number}/${plan.installments_count}`,
      // Se registra en la fecha de vencimiento de la cuota (así una cuota
      // anterior queda registrada en su fecha real, aunque la marques hoy).
      occurred_on: payment.due_date ?? todayYMD(),
      installment_plan_id: payment.installment_plan_id,
    })
    .select("id")
    .single();

  if (txErr || !tx) return;

  await supabase
    .from("installment_payments")
    .update({ paid_on: todayYMD(), transaction_id: tx.id })
    .eq("id", paymentId);

  // ¿Quedan cuotas sin pagar? Si no, el plan queda completado.
  const { count: pending } = await supabase
    .from("installment_payments")
    .select("id", { count: "exact", head: true })
    .eq("installment_plan_id", payment.installment_plan_id)
    .is("paid_on", null);

  await supabase
    .from("installment_plans")
    .update({ is_completed: (pending ?? 0) === 0 })
    .eq("id", payment.installment_plan_id)
    .eq("user_id", user.id);

  revalidate(payment.installment_plan_id);
}

/** Revierte el pago de una cuota (borra el gasto asociado). */
export async function unpayInstallment(formData: FormData) {
  const paymentId = String(formData.get("payment_id") ?? "");
  if (!paymentId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: payment } = await supabase
    .from("installment_payments")
    .select("id, transaction_id, installment_plan_id")
    .eq("id", paymentId)
    .maybeSingle();
  if (!payment) return;

  if (payment.transaction_id) {
    await supabase
      .from("transactions")
      .delete()
      .eq("id", payment.transaction_id)
      .eq("user_id", user.id);
  }

  await supabase
    .from("installment_payments")
    .update({ paid_on: null, transaction_id: null })
    .eq("id", paymentId);

  await supabase
    .from("installment_plans")
    .update({ is_completed: false })
    .eq("id", payment.installment_plan_id)
    .eq("user_id", user.id);

  revalidate(payment.installment_plan_id);
}

/** Borra un plan de cuotas (sus cuotas se borran en cascada). */
export async function deletePlan(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("installment_plans")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  revalidate();
}
