"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Agrega una persona (etiqueta) para dividir gastos. */
export async function addPerson(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("people").insert({ user_id: user.id, name });
  revalidatePath("/dashboard/people");
}

/** Borra una persona. */
export async function deletePerson(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("people").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/dashboard/people");
}
