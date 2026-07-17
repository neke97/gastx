"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type GroupFormState = { error?: string; ok?: boolean } | null;

/** Crea un grupo y redirige a su detalle. */
export async function createGroup(
  _prev: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Escribí un nombre para el grupo." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_group", { p_name: name });
  if (error) return { error: error.message };

  revalidatePath("/dashboard/groups");
  redirect(`/dashboard/groups/${data}`);
}

/** Invita a alguien por correo. */
export async function inviteToGroup(
  _prev: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  const groupId = String(formData.get("group_id") ?? "");
  const email = String(formData.get("email") ?? "").trim();
  if (!groupId || !email) return { error: "Faltan datos." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("invite_to_group", {
    p_group: groupId,
    p_email: email,
  });
  if (error) return { error: error.message };

  revalidatePath(`/dashboard/groups/${groupId}`);
  return { ok: true };
}

async function rpcAndRevalidate(
  fn: string,
  args: Record<string, unknown>,
  paths: string[],
) {
  const supabase = await createClient();
  await supabase.rpc(fn, args);
  for (const p of paths) revalidatePath(p);
}

/** Acepta una invitación (formData: invite_id). */
export async function acceptInvite(formData: FormData) {
  const id = String(formData.get("invite_id") ?? "");
  if (!id) return;
  await rpcAndRevalidate("accept_group_invite", { p_invite: id }, [
    "/dashboard/groups",
  ]);
}

/** Rechaza una invitación (formData: invite_id). */
export async function declineInvite(formData: FormData) {
  const id = String(formData.get("invite_id") ?? "");
  if (!id) return;
  await rpcAndRevalidate("decline_group_invite", { p_invite: id }, [
    "/dashboard/groups",
  ]);
}

/** Sale de un grupo. */
export async function leaveGroup(formData: FormData) {
  const groupId = String(formData.get("group_id") ?? "");
  if (!groupId) return;
  const supabase = await createClient();
  await supabase.rpc("leave_group", { p_group: groupId });
  revalidatePath("/dashboard/groups");
  redirect("/dashboard/groups");
}

/** Quita a un miembro (solo dueño). */
export async function removeMember(formData: FormData) {
  const groupId = String(formData.get("group_id") ?? "");
  const userId = String(formData.get("user_id") ?? "");
  if (!groupId || !userId) return;
  await rpcAndRevalidate(
    "remove_group_member",
    { p_group: groupId, p_user: userId },
    [`/dashboard/groups/${groupId}`],
  );
}

/** Borra un grupo (solo dueño). */
export async function deleteGroup(formData: FormData) {
  const groupId = String(formData.get("group_id") ?? "");
  if (!groupId) return;
  const supabase = await createClient();
  await supabase.rpc("delete_group", { p_group: groupId });
  revalidatePath("/dashboard/groups");
  redirect("/dashboard/groups");
}
