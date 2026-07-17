"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cancelSubscription } from "@/lib/paypal";

function revalidate() {
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/reports");
}

/** Cambia la moneda base del usuario. */
export async function updateBaseCurrency(formData: FormData) {
  const code = String(formData.get("base") ?? "").trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("profiles")
    .update({ default_currency: code })
    .eq("id", user.id);
  revalidate();
}

/** Crea o actualiza un tipo de cambio. */
export async function upsertRate(formData: FormData) {
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const rate = Number(formData.get("rate"));
  if (!/^[A-Z]{3}$/.test(code) || !Number.isFinite(rate) || rate <= 0) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("exchange_rates")
    .upsert(
      { user_id: user.id, code, rate_to_base: rate },
      { onConflict: "user_id,code" },
    );
  revalidate();
}

/** Borra un tipo de cambio. */
export async function deleteRate(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("exchange_rates").delete().eq("id", id).eq("user_id", user.id);
  revalidate();
}

/**
 * Cancela la suscripción PayPal del usuario. El acceso continúa hasta el fin
 * del período ya pagado (current_period_end); luego expira solo.
 */
export async function cancelMySubscription() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("paypal_subscription_id, subscription_status")
    .eq("id", user.id)
    .maybeSingle();

  const subId = profile?.paypal_subscription_id;
  if (!subId || profile?.subscription_status !== "active") return;

  const ok = await cancelSubscription(subId);
  if (ok) {
    // Marcar como cancelada (el acceso sigue hasta current_period_end).
    await createAdminClient()
      .from("profiles")
      .update({ subscription_status: "cancelled" })
      .eq("id", user.id);
  }
  revalidate();
}
