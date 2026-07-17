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

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
function todayYMD() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * Agrega un gasto del grupo (pagado por vos) y lo divide en partes iguales
 * entre todos los miembros actuales.
 */
export async function addGroupExpense(
  _prev: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  const groupId = String(formData.get("group_id") ?? "");
  const amount = Number(formData.get("amount"));
  const description = String(formData.get("description") ?? "").trim();
  const occurredOn = String(formData.get("occurred_on") ?? "").trim() || todayYMD();

  if (!groupId) return { error: "Falta el grupo." };
  if (!Number.isFinite(amount) || amount <= 0)
    return { error: "El monto debe ser mayor a 0." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Volvé a ingresar." };

  // Debe ser miembro del grupo.
  const { data: me } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!me) return { error: "No sos miembro de este grupo." };

  const { data: members } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId);
  const ids = (members ?? []).map((m) => m.user_id);
  if (ids.length === 0) return { error: "El grupo no tiene miembros." };

  // Crear la transacción (pagador = vos).
  const { data: tx, error: txErr } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      kind: "expense",
      amount,
      group_id: groupId,
      description: description || null,
      occurred_on: occurredOn,
    })
    .select("id")
    .single();
  if (txErr || !tx) {
    return { error: txErr?.message ?? "No se pudo guardar el gasto." };
  }

  // Dividir en partes iguales; la última cuota ajusta el redondeo.
  const base = Math.floor((amount / ids.length) * 100) / 100;
  const rows = ids.map((uid, i) => ({
    transaction_id: tx.id,
    member_user_id: uid,
    split_mode: "amount" as const,
    value: i === ids.length - 1 ? round2(amount - base * (ids.length - 1)) : base,
    amount_resolved:
      i === ids.length - 1 ? round2(amount - base * (ids.length - 1)) : base,
  }));

  const { error: splitErr } = await supabase
    .from("transaction_splits")
    .insert(rows);
  if (splitErr) {
    await supabase.from("transactions").delete().eq("id", tx.id);
    return { error: `No se pudo dividir el gasto: ${splitErr.message}` };
  }

  revalidatePath(`/dashboard/groups/${groupId}`);
  return { ok: true };
}

/** Borra un gasto del grupo (solo el pagador). */
export async function deleteGroupExpense(formData: FormData) {
  const groupId = String(formData.get("group_id") ?? "");
  const txId = String(formData.get("tx_id") ?? "");
  if (!txId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("transactions")
    .delete()
    .eq("id", txId)
    .eq("user_id", user.id);

  revalidatePath(`/dashboard/groups/${groupId}`);
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
