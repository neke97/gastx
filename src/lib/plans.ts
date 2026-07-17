/**
 * Definición de planes. El precio se MUESTRA en colones (moneda base del
 * usuario), pero PayPal no soporta CRC, así que el COBRO real es en USD
 * (equivalente aproximado). Los IDs de plan de PayPal se crean con
 * `scripts/paypal-setup-plans.mjs` y se guardan en variables de entorno.
 */

export type PlanInterval = "monthly" | "annual";

export const PLANS: Record<
  PlanInterval,
  { label: string; priceLabel: string; usd: number; note?: string }
> = {
  monthly: {
    label: "Mensual",
    priceLabel: "₡500 / mes",
    usd: 0.95,
  },
  annual: {
    label: "Anual",
    priceLabel: "₡5.000 / año",
    usd: 9.5,
    note: "Ahorrás ~₡1.000 al año",
  },
};
