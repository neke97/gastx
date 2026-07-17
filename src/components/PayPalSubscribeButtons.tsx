"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PayPalScriptProvider,
  PayPalButtons,
} from "@paypal/react-paypal-js";
import { PLANS, type PlanInterval } from "@/lib/plans";

export function PayPalSubscribeButtons({
  clientId,
  monthlyPlan,
  annualPlan,
}: {
  clientId: string;
  monthlyPlan: string;
  annualPlan: string;
}) {
  const router = useRouter();
  const [interval, setInterval] = useState<PlanInterval>("annual");
  const [error, setError] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);

  const planId = interval === "monthly" ? monthlyPlan : annualPlan;

  return (
    <div className="flex flex-col gap-4">
      {/* Selector de intervalo */}
      <div className="grid grid-cols-2 gap-2">
        {(["monthly", "annual"] as const).map((k) => {
          const active = interval === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => {
                setInterval(k);
                setError(null);
              }}
              className={`flex flex-col items-center gap-0.5 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "border-emerald-500 bg-emerald-500/10 font-semibold"
                  : "border-black/15 dark:border-white/15"
              }`}
            >
              <span>{PLANS[k].label}</span>
              <span className="text-xs text-black/60 dark:text-white/60">
                {PLANS[k].priceLabel}
              </span>
            </button>
          );
        })}
      </div>

      {PLANS[interval].note && (
        <p className="text-center text-xs text-emerald-600 dark:text-emerald-400">
          {PLANS[interval].note}
        </p>
      )}

      <PayPalScriptProvider
        options={{
          clientId,
          vault: true,
          intent: "subscription",
          currency: "USD",
          components: "buttons",
        }}
      >
        <PayPalButtons
          // Forzar re-render del botón al cambiar de plan.
          key={planId}
          style={{ layout: "vertical", label: "subscribe", shape: "pill" }}
          disabled={activating}
          createSubscription={(_data, actions) =>
            actions.subscription.create({ plan_id: planId })
          }
          onApprove={async (data) => {
            setActivating(true);
            setError(null);
            try {
              const res = await fetch("/api/paypal/activate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subscriptionID: data.subscriptionID }),
              });
              if (res.ok) {
                router.refresh();
                router.push("/dashboard");
                return;
              }
              setError(
                "El pago se registró pero no pudimos activar el acceso. Recargá la página o escribinos.",
              );
            } catch {
              setError("No se pudo activar el acceso. Probá recargar la página.");
            } finally {
              setActivating(false);
            }
          }}
          onError={() => {
            setError("Hubo un problema con PayPal. Probá de nuevo.");
          }}
        />
      </PayPalScriptProvider>

      <p className="text-center text-xs text-black/50 dark:text-white/50">
        Cobro en USD (~${PLANS[interval].usd.toFixed(2)}), equivalente al precio en
        colones.
      </p>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
