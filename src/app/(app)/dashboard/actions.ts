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

  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    kind,
    amount,
    category_id: categoryId ? String(categoryId) : null,
    description: description || null,
    ...(occurredOn ? { occurred_on: occurredOn } : {}),
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { ok: true };
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
