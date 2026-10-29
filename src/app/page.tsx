import Link from "next/link";
import { InstallAppButton } from "@/components/InstallAppButton";

const FEATURES = [
  { icon: "⚡", title: "Gastos en 2 toques", text: "Monto, categoría y listo." },
  { icon: "🔁", title: "Recurrentes", text: "Salario, alquiler, pase de bus." },
  { icon: "👥", title: "Dividir gastos", text: "Por monto o por porcentaje." },
  { icon: "💳", title: "Cuotas", text: "Mirá cuánto te falta pagar." },
  { icon: "📊", title: "Reportes", text: "A dónde se va la plata." },
  { icon: "🌎", title: "Multi-moneda", text: "Colones, dólares y más." },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-5 pb-12 pt-10">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 px-6 pb-8 pt-10 text-center text-white shadow-2xl shadow-emerald-700/30">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/10" />
        <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-12 h-44 w-44 rounded-full bg-black/10" />
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-4xl font-bold text-emerald-600 shadow-lg">
          ₡
        </div>
        <h1 className="relative mt-5 text-4xl font-bold tracking-tight">GastX</h1>
        <p className="relative mx-auto mt-2 max-w-xs text-balance text-white/85">
          Tus gastos e ingresos claros, bonitos y siempre a mano.
        </p>
        <Link
          href="/login"
          className="relative mt-7 inline-flex w-full items-center justify-center rounded-2xl bg-white px-6 py-3.5 font-semibold text-emerald-700 shadow-lg"
        >
          Empezar gratis
        </Link>
        <p className="relative mt-3 text-xs text-white/70">Sin tarjeta · Funciona en tu celular</p>
      </section>

      <section className="grid grid-cols-2 gap-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="card p-4">
            <span className="text-2xl" aria-hidden>
              {f.icon}
            </span>
            <p className="mt-2 text-sm font-semibold">{f.title}</p>
            <p className="mt-0.5 text-xs text-black/50 dark:text-white/50">{f.text}</p>
          </div>
        ))}
      </section>

      <InstallAppButton className="mx-auto" />

      <p className="text-center text-xs text-black/35 dark:text-white/35">
        Hecho con 💚 en Costa Rica
      </p>
    </main>
  );
}
