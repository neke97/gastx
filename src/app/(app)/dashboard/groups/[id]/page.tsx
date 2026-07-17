import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InviteMemberForm } from "@/components/InviteMemberForm";
import { GroupExpenseForm } from "@/components/GroupExpenseForm";
import { SubmitButton } from "@/components/SubmitButton";
import {
  leaveGroup,
  removeMember,
  deleteGroup,
  deleteGroupExpense,
} from "../actions";
import { formatMoney, formatDate } from "@/lib/format";

type Member = {
  user_id: string;
  role: "owner" | "member";
  profiles: { display_name: string | null } | null;
};
type Invite = { id: string; email: string; status: string };
type Expense = {
  id: string;
  amount: number;
  description: string | null;
  occurred_on: string;
  user_id: string;
  transaction_splits: { member_user_id: string | null; amount_resolved: number }[];
};

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

  const [{ data: group }, { data: members }, { data: invites }, { data: expenses }] =
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
      supabase
        .from("transactions")
        .select(
          "id, amount, description, occurred_on, user_id, transaction_splits(member_user_id, amount_resolved)",
        )
        .eq("group_id", id)
        .eq("kind", "expense")
        .order("occurred_on", { ascending: false }),
    ]);

  if (!group) notFound();

  const isOwner = group.owner_id === user.id;
  const memberList = (members ?? []) as unknown as Member[];
  const pending = (invites ?? []) as Invite[];
  const expenseList = (expenses ?? []) as unknown as Expense[];

  // Nombre por id de usuario (para mostrar pagador y saldos).
  const nameById = new Map<string, string>();
  for (const m of memberList) {
    nameById.set(
      m.user_id,
      m.profiles?.display_name ?? (m.user_id === user.id ? "Vos" : "Miembro"),
    );
  }

  // Saldos: pagado − parte que le tocaba, por miembro.
  const paid = new Map<string, number>();
  const owed = new Map<string, number>();
  for (const e of expenseList) {
    paid.set(e.user_id, (paid.get(e.user_id) ?? 0) + Number(e.amount));
    for (const s of e.transaction_splits) {
      if (!s.member_user_id) continue;
      owed.set(
        s.member_user_id,
        (owed.get(s.member_user_id) ?? 0) + Number(s.amount_resolved),
      );
    }
  }
  const balances = memberList.map((m) => ({
    userId: m.user_id,
    name: nameById.get(m.user_id) ?? "Miembro",
    net: Math.round(((paid.get(m.user_id) ?? 0) - (owed.get(m.user_id) ?? 0)) * 100) / 100,
  }));
  const hasExpenses = expenseList.length > 0;

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

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-black/70 dark:text-white/70">
          Nuevo gasto del grupo
        </h2>
        <GroupExpenseForm groupId={group.id} memberCount={memberList.length} />
      </section>

      {hasExpenses && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-black/70 dark:text-white/70">
            Saldos
          </h2>
          <ul className="flex flex-col divide-y divide-black/5 overflow-hidden rounded-xl border border-black/10 dark:divide-white/5 dark:border-white/10">
            {balances.map((b) => (
              <li
                key={b.userId}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <span>{b.name}</span>
                {b.net > 0 ? (
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    le deben {formatMoney(b.net)}
                  </span>
                ) : b.net < 0 ? (
                  <span className="font-medium text-red-600 dark:text-red-400">
                    debe {formatMoney(-b.net)}
                  </span>
                ) : (
                  <span className="text-black/40 dark:text-white/40">al día</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-black/70 dark:text-white/70">
          Gastos del grupo
        </h2>
        {!hasExpenses ? (
          <p className="rounded-xl border border-black/10 bg-black/[0.02] px-4 py-6 text-center text-sm text-black/50 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/50">
            Todavía no hay gastos en este grupo.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-black/5 overflow-hidden rounded-xl border border-black/10 dark:divide-white/5 dark:border-white/10">
            {expenseList.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {e.description || "Gasto"}
                  </p>
                  <p className="text-xs text-black/50 dark:text-white/50">
                    Pagó {nameById.get(e.user_id) ?? "?"} ·{" "}
                    {formatDate(e.occurred_on)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm font-semibold">
                    {formatMoney(e.amount)}
                  </span>
                  {e.user_id === user.id && (
                    <form action={deleteGroupExpense}>
                      <input type="hidden" name="group_id" value={group.id} />
                      <input type="hidden" name="tx_id" value={e.id} />
                      <SubmitButton
                        aria-label="Borrar gasto"
                        title="Borrar"
                        className="rounded-md px-2 py-1 text-black/30 transition-colors hover:bg-red-500/10 hover:text-red-600 dark:text-white/30 dark:hover:text-red-400"
                      >
                        ✕
                      </SubmitButton>
                    </form>
                  )}
                </div>
              </li>
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
