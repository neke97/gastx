import { signIn, signUp } from "./actions";

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
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-700 text-3xl font-bold text-white shadow-lg">
            ₡
          </div>
          <h1 className="text-2xl font-bold tracking-tight">GastX</h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            Ingresá para registrar tus gastos e ingresos.
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

        <form className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Correo</span>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="vos@ejemplo.com"
              className="rounded-lg border border-black/15 bg-transparent px-3 py-2.5 outline-none focus:border-emerald-500 dark:border-white/15"
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
              className="rounded-lg border border-black/15 bg-transparent px-3 py-2.5 outline-none focus:border-emerald-500 dark:border-white/15"
            />
          </label>

          <button
            formAction={signIn}
            className="mt-2 rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-emerald-700"
          >
            Iniciar sesión
          </button>
          <button
            formAction={signUp}
            className="rounded-lg border border-black/15 px-4 py-2.5 font-medium transition-colors hover:bg-black/[0.04] dark:border-white/15 dark:hover:bg-white/[0.06]"
          >
            Crear cuenta
          </button>
        </form>
      </div>
    </main>
  );
}
