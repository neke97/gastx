import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateGroupForm } from "@/components/CreateGroupForm";
import { SubmitButton } from "@/components/SubmitButton";
import { acceptInvite, declineInvite } from "./actions";

type GroupRow = { groups: { id: string; name: string } | null };
type Invite = {
  id: string;
  groups: { name: string } | null;
};

export default async function GroupsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const email = (user.email ?? "").toLowerCase();

  const [{ data: memberships }, { data: invites }] = await Promise.all([
    supabase
      .from("group_members")
      .select("groups(id, name)")
      .order("created_at", { ascending: false }),
    supabase
      .from("group_invites")
      .select("id, groups(name)")
      .eq("email", email)
      .eq("status", "pending"),
  ]);

  const groups = (memberships ?? [])
    .map((m) => (m as unknown as GroupRow).groups)
    .filter(Boolean) as { id: string; name: string }[];
  const pending = (invites ?? []) as unknown as Invite[];

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-5 py-8">
      <header className="flex items-center gap-3">
        <Link
          href="/dashboard/more"
          className="text-sm text-black/60 hover:underline dark:text-white/60"
        >
          ← Volver
        </Link>
        <h1 className="text-xl font-bold tracking-tight">Grupos</h1>
      </header>

      <p className="text-sm text-black/60 dark:text-white/60">
        Compartí un grupo (hogar, viaje…) con otras personas para dividir gastos
        entre cuentas reales.
      </p>

      <CreateGroupForm />

      {pending.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-black/70 dark:text-white/70">
            Invitaciones pendientes
          </h2>
          <ul className="flex flex-col divide-y divide-black/5 overflow-hidden rounded-xl border border-black/10 dark:divide-white/5 dark:border-white/10">
            {pending.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <span className="text-sm">
                  Te invitaron a{" "}
                  <span className="font-medium">
                    {inv.groups?.name ?? "un grupo"}
                  </span>
                </span>
                <div className="flex shrink-0 gap-2">
                  <form action={acceptInvite}>
                    <input type="hidden" name="invite_id" value={inv.id} />
                    <SubmitButton
                      pendingLabel="…"
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
                    >
                      Aceptar
                    </SubmitButton>
                  </form>
                  <form action={declineInvite}>
                    <input type="hidden" name="invite_id" value={inv.id} />
                    <SubmitButton
                      pendingLabel="…"
                      className="rounded-lg border border-black/15 px-3 py-1.5 text-xs transition-colors hover:bg-black/[0.04] dark:border-white/15 dark:hover:bg-white/[0.06]"
                    >
                      Rechazar
                    </SubmitButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-black/70 dark:text-white/70">
          Mis grupos
        </h2>
        {groups.length === 0 ? (
          <p className="rounded-xl border border-black/10 bg-black/[0.02] px-4 py-6 text-center text-sm text-black/50 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/50">
            Todavía no estás en ningún grupo.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-black/5 overflow-hidden rounded-xl border border-black/10 dark:divide-white/5 dark:border-white/10">
            {groups.map((g) => (
              <li key={g.id}>
                <Link
                  href={`/dashboard/groups/${g.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3.5 text-sm transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-lg">👥</span>
                    {g.name}
                  </span>
                  <span className="text-black/30 dark:text-white/30">›</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
