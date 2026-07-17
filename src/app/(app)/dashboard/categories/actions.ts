"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CatFormState = { error?: string; ok?: boolean } | null;

function revalidate() {
  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard");
}

/** Crea una categoría nueva. */
export async function addCategory(
  _prev: CatFormState,
  formData: FormData,
): Promise<CatFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Volvé a ingresar." };

  const name = String(formData.get("name") ?? "").trim();
  const kind = String(formData.get("kind") ?? "expense");
  const color = String(formData.get("color") ?? "").trim() || null;
  const icon = String(formData.get("icon") ?? "").trim() || null;

  if (!name) return { error: "Escribí un nombre para la categoría." };
  if (kind !== "expense" && kind !== "income") {
    return { error: "Tipo inválido." };
  }

  const { error } = await supabase
    .from("categories")
    .insert({ user_id: user.id, name, kind, color, icon });

  if (error) return { error: error.message };

  revalidate();
  return { ok: true };
}

/** Archiva o desarchiva una categoría. */
export async function toggleArchiveCategory(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const archive = String(formData.get("archive") ?? "") === "true";
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("categories")
    .update({ is_archived: archive })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidate();
}

/** Borra una categoría (los movimientos quedan sin categoría). */
export async function deleteCategory(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  revalidate();
}
