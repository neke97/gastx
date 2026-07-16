import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addPerson, deletePerson } from "./actions";

type Person = { id: string; name: string };

export default async function PeoplePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("people")
    .select("id, name")
    .order("name");

  const people = (data ?? []) as Person[];

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-5 py-8">
      <header className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="text-sm text-black/60 hover:underline dark:text-white/60"
        >
          ← Volver
        </Link>
        <h1 className="text-xl font-bold tracking-tight">Personas</h1>
      </header>

      <p className="text-sm text-black/60 dark:text-white/60">
        Agregá personas para dividir gastos entre ellas (por monto o porcentaje).
      </p>

      <form
        action={addPerson}
        className="flex gap-2 rounded-2xl border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.03]"
      >
        <input
          type="text"
          name="name"
          required
          placeholder="Nombre (ej. Ana, Roommate…)"
          className="flex-1 rounded-lg border border-black/15 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-white/15"
        />
        <button
          type="submit"
          className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
        >
          Agregar
        </button>
      </form>

      {people.length === 0 ? (
        <p className="rounded-xl border border-black/10 bg-black/[0.02] px-4 py-6 text-center text-sm text-black/50 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/50">
          Todavía no agregaste personas.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-black/5 overflow-hidden rounded-xl border border-black/10 dark:divide-white/5 dark:border-white/10">
          {people.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <span className="flex min-w-0 items-center gap-3 text-sm">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600/15 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  {p.name.charAt(0).toUpperCase()}
                </span>
                <span className="truncate">{p.name}</span>
              </span>
              <form action={deletePerson}>
                <input type="hidden" name="id" value={p.id} />
                <button
                  type="submit"
                  aria-label="Borrar persona"
                  title="Borrar"
                  className="rounded-md px-2 py-1 text-black/30 transition-colors hover:bg-red-500/10 hover:text-red-600 dark:text-white/30 dark:hover:text-red-400"
                >
                  ✕
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
