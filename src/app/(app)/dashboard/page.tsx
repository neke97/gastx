import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex flex-1 flex-col gap-6 px-6 py-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hola 👋</h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            {user.email}
          </p>
        </div>
        <form action={signOut}>
          <button className="rounded-lg border border-black/15 px-3 py-2 text-sm transition-colors hover:bg-black/[0.04] dark:border-white/15 dark:hover:bg-white/[0.06]">
            Salir
          </button>
        </form>
      </header>

      <div className="rounded-2xl border border-black/10 bg-black/[0.02] px-5 py-8 text-center dark:border-white/10 dark:bg-white/[0.03]">
        <p className="text-sm text-black/60 dark:text-white/60">
          Aquí irá el resumen del mes y tus movimientos.
        </p>
        <p className="mt-1 text-xs text-black/40 dark:text-white/40">
          Próxima pieza: registrar gastos e ingresos.
        </p>
      </div>
    </main>
  );
}
