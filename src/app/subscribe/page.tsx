import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasAccess, ACCESS_COLUMNS } from "@/lib/access";
import { PromoCodeForm } from "@/components/PromoCodeForm";
import { PayPalSubscribeButtons } from "@/components/PayPalSubscribeButtons";
import { SubmitButton } from "@/components/SubmitButton";
import { signOut } from "@/app/(app)/dashboard/actions";

const PLAN_FEATURES = [
  "Gastos e ingresos ilimitados",
  "Recurrentes y cuotas",
  "División de gastos y grupos",
  "Reportes visuales",
];

export default async function SubscribePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(ACCESS_COLUMNS)
    .eq("id", user.id)
    .maybeSingle();
  if (hasAccess(profile)) redirect("/dashboard");

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const monthlyPlan = process.env.NEXT_PUBLIC_PAYPAL_PLAN_MONTHLY;
  const annualPlan = process.env.NEXT_PUBLIC_PAYPAL_PLAN_ANNUAL;
  const paypalReady = Boolean(clientId && monthlyPlan && annualPlan);

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-12">
      <header className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-700 text-3xl font-bold text-white shadow-lg">
          ₡
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Activá tu cuenta</h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          Suscribite para usar GastX, o ingresá un código promocional si tenés
          uno.
        </p>
      </header>

      {/* Plan + suscripción */}
      <section className="flex flex-col gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.04] p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold">Plan GastX Pro</h2>
        </div>
        <ul className="flex flex-col gap-1.5 text-sm">
          {PLAN_FEATURES.map((f) => (
            <li key={f} className="flex items-center gap-2">
              <span className="text-emerald-600 dark:text-emerald-400">✓</span>
              {f}
            </li>
          ))}
        </ul>

        {paypalReady ? (
          <PayPalSubscribeButtons
            clientId={clientId!}
            monthlyPlan={monthlyPlan!}
            annualPlan={annualPlan!}
          />
        ) : (
          <div className="rounded-lg border border-black/10 bg-black/[0.02] px-4 py-3 text-center text-sm text-black/60 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/60">
            Los pagos con PayPal se están configurando. Mientras tanto, usá un
            código promocional abajo.
          </div>
        )}
      </section>

      {/* Código promocional */}
      <section className="flex flex-col gap-3 rounded-2xl border border-black/10 p-5 dark:border-white/10">
        <h2 className="font-semibold">¿Tenés un código?</h2>
        <PromoCodeForm />
      </section>

      <form action={signOut} className="text-center">
        <SubmitButton
          pendingLabel="Saliendo…"
          className="text-sm text-black/50 underline hover:text-black/80 dark:text-white/50 dark:hover:text-white/80"
        >
          Cerrar sesión
        </SubmitButton>
      </form>
    </main>
  );
}
