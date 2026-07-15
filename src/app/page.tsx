import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-700 text-4xl font-bold text-white shadow-lg">
          ₡
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">GastX</h1>
        <p className="max-w-md text-balance text-base text-black/60 dark:text-white/60">
          Registrá tus gastos e ingresos, dividí gastos entre personas,
          controlá cuotas y mirá a dónde se va la plata.
        </p>
      </div>

      <ul className="grid w-full max-w-md gap-3 text-left">
        {[
          "Gastos e ingresos en pocos toques",
          "Recurrentes: salario, mensualidad, pases de bus",
          "Dividir gastos por monto o porcentaje",
          "Control de compras a cuotas",
          "Reportes y gráficos visuales",
        ].map((item) => (
          <li
            key={item}
            className="flex items-center gap-3 rounded-xl border border-black/10 bg-black/[0.02] px-4 py-3 text-sm dark:border-white/10 dark:bg-white/[0.03]"
          >
            <span className="text-emerald-600 dark:text-emerald-400">✓</span>
            {item}
          </li>
        ))}
      </ul>

      <Link
        href="/login"
        className="rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white transition-colors hover:bg-emerald-700"
      >
        Ingresar
      </Link>
    </main>
  );
}
