import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CategoryForm } from "@/components/CategoryForm";
import { toggleArchiveCategory, deleteCategory } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { categoryIcon } from "@/lib/categoryIcons";

type Category = {
  id: string;
  name: string;
  kind: "expense" | "income";
  color: string | null;
  icon: string | null;
  is_archived: boolean;
};

function CategoryRow({ c }: { c: Category }) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base"
          style={{ backgroundColor: (c.color ?? "#94a3b8") + "22" }}
        >
          {categoryIcon(c.icon)}
        </span>
        <span
          className={`truncate text-sm ${c.is_archived ? "text-black/40 line-through dark:text-white/40" : ""}`}
        >
          {c.name}
        </span>
        {c.is_archived && (
          <span className="shrink-0 rounded-full bg-black/10 px-2 py-0.5 text-xs text-black/50 dark:bg-white/10 dark:text-white/50">
            archivada
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <form action={toggleArchiveCategory}>
          <input type="hidden" name="id" value={c.id} />
          <input
            type="hidden"
            name="archive"
            value={c.is_archived ? "false" : "true"}
          />
          <SubmitButton
            title={c.is_archived ? "Desarchivar" : "Archivar"}
            pendingLabel="…"
            className="rounded-md px-2 py-1 text-xs text-black/50 transition-colors hover:bg-black/[0.06] dark:text-white/50 dark:hover:bg-white/10"
          >
            {c.is_archived ? "Restaurar" : "Archivar"}
          </SubmitButton>
        </form>
        <form action={deleteCategory}>
          <input type="hidden" name="id" value={c.id} />
          <SubmitButton
            aria-label="Borrar categoría"
            title="Borrar"
            className="rounded-md px-2 py-1 text-black/30 transition-colors hover:bg-red-500/10 hover:text-red-600 dark:text-white/30 dark:hover:text-red-400"
          >
            ✕
          </SubmitButton>
        </form>
      </div>
    </li>
  );
}

export default async function CategoriesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("categories")
    .select("id, name, kind, color, icon, is_archived")
    .order("is_archived")
    .order("name");

  const categories = (data ?? []) as Category[];
  const income = categories.filter((c) => c.kind === "income");
  const expense = categories.filter((c) => c.kind === "expense");

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-5 py-8">
      <header className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="text-sm text-black/60 hover:underline dark:text-white/60"
        >
          ← Volver
        </Link>
        <h1 className="text-xl font-bold tracking-tight">Categorías</h1>
      </header>

      <CategoryForm />

      {[
        { title: "Gastos", items: expense },
        { title: "Ingresos", items: income },
      ].map((group) => (
        <section key={group.title} className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-black/70 dark:text-white/70">
            {group.title}
          </h2>
          {group.items.length === 0 ? (
            <p className="rounded-xl border border-black/10 bg-black/[0.02] px-4 py-4 text-center text-sm text-black/50 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/50">
              Sin categorías todavía.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-black/5 overflow-hidden rounded-xl border border-black/10 dark:divide-white/5 dark:border-white/10">
              {group.items.map((c) => (
                <CategoryRow key={c.id} c={c} />
              ))}
            </ul>
          )}
        </section>
      ))}
    </main>
  );
}
