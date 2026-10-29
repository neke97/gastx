import { signIn, signUp } from "./actions";
import { InstallAppButton } from "@/components/InstallAppButton";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-700 text-3xl font-bold text-white shadow-xl shadow-emerald-700/30">
            ₡
          </div>
          <h1 className="text-2xl font-bold tracking-tight">GastX</h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            ¡Qué bueno verte! Ingresá para seguir.
          </p>
        </div>

        {error && (
          <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        {message && (
          <p className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
            {message}
          </p>
        )}

        <form className="card flex flex-col gap-4 p-5">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Correo</span>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="vos@ejemplo.com"
              className="rounded-xl border border-black/10 bg-black/[0.03] px-3.5 py-3 text-[15px] outline-none transition-colors focus:border-emerald-500 focus:bg-white dark:border-white/10 dark:bg-white/[0.05] dark:focus:bg-white/[0.08]"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Contraseña</span>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              autoComplete="current-password"
              placeholder="••••••••"
              className="rounded-xl border border-black/10 bg-black/[0.03] px-3.5 py-3 text-[15px] outline-none transition-colors focus:border-emerald-500 focus:bg-white dark:border-white/10 dark:bg-white/[0.05] dark:focus:bg-white/[0.08]"
            />
          </label>

          <button
            formAction={signIn}
            className="mt-2 rounded-2xl bg-emerald-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700"
          >
            Iniciar sesión
          </button>
          <button
            formAction={signUp}
            className="rounded-2xl px-4 py-3 font-semibold text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400"
          >
            Crear cuenta
          </button>
        </form>

        <InstallAppButton className="mt-6" />
      </div>
    </main>
  );
}
