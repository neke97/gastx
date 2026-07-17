import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InviteMemberForm } from "@/components/InviteMemberForm";
import { SubmitButton } from "@/components/SubmitButton";
import { leaveGroup, removeMember, deleteGroup } from "../actions";

type Member = {
  user_id: string;
  role: "owner" | "member";
  profiles: { display_name: string | null } | null;
};
type Invite = { id: string; email: string; status: string };

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: group }, { data: members }, { data: invites }] =
    await Promise.all([
      supabase.from("groups").select("id, name, owner_id").eq("id", id).maybeSingle(),
      supabase
        .from("group_members")
        .select("user_id, role, profiles(display_name)")
        .eq("group_id", id)
        .order("role"),
      supabase
        .from("group_invites")
        .select("id, email, status")
        .eq("group_id", id)
        .eq("status", "pending"),
    ]);

  if (!group) notFound();

  const isOwner = group.owner_id === user.id;
  const memberList = (members ?? []) as unknown as Member[];
  const pending = (invites ?? []) as Invite[];

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-5 py-8">
      <header className="flex items-center gap-3">
        <Link
          href="/dashboard/groups"
          className="text-sm text-black/60 hover:underline dark:text-white/60"
        >
          ← Volver
        </Link>
        <h1 className="text-xl font-bold tracking-tight">{group.name}</h1>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-black/70 dark:text-white/70">
          Miembros
        </h2>
        <ul className="flex flex-col divide-y divide-black/5 overflow-hidden rounded-xl border border-black/10 dark:divide-white/5 dark:border-white/10">
          {memberList.map((m) => (
            <li
              key={m.user_id}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
            >
              <span className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600/15 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  {(m.profiles?.display_name ?? "?").charAt(0).toUpperCase()}
                </span>
                {m.profiles?.display_name ?? "Miembro"}
                {m.user_id === user.id && (
                  <span className="text-xs text-black/40 dark:text-white/40">
                    (vos)
                  </span>
                )}
                {m.role === "owner" && (
                  <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs text-black/50 dark:bg-white/10 dark:text-white/50">
                    dueño
                  </span>
                )}
              </span>
              {isOwner && m.role !== "owner" && (
                <form action={removeMember}>
                  <input type="hidden" name="group_id" value={group.id} />
                  <input type="hidden" name="user_id" value={m.user_id} />
                  <SubmitButton
                    aria-label="Quitar miembro"
                    title="Quitar"
                    className="rounded-md px-2 py-1 text-black/30 transition-colors hover:bg-red-500/10 hover:text-red-600 dark:text-white/30 dark:hover:text-red-400"
                  >
                    ✕
                  </SubmitButton>
                </form>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-black/70 dark:text-white/70">
          Invitar
        </h2>
        <InviteMemberForm groupId={group.id} />
        {pending.length > 0 && (
          <ul className="mt-1 flex flex-col gap-1 text-xs text-black/50 dark:text-white/50">
            {pending.map((i) => (
              <li key={i.id}>Pendiente: {i.email}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-2">
        {isOwner ? (
          <form action={deleteGroup}>
            <input type="hidden" name="group_id" value={group.id} />
            <SubmitButton
              pendingLabel="Borrando…"
              className="w-full rounded-lg border border-red-500/40 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400"
            >
              Borrar grupo
            </SubmitButton>
          </form>
        ) : (
          <form action={leaveGroup}>
            <input type="hidden" name="group_id" value={group.id} />
            <SubmitButton
              pendingLabel="Saliendo…"
              className="w-full rounded-lg border border-black/15 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-black/[0.04] dark:border-white/15 dark:hover:bg-white/[0.06]"
            >
              Salir del grupo
            </SubmitButton>
          </form>
        )}
      </section>
    </main>
  );
}
