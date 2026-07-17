/**
 * Helpers de PayPal — SOLO servidor. Usa la REST API con credenciales
 * client_id / client_secret (nunca exponer el secret al navegador).
 */

const ENV = process.env.PAYPAL_ENV === "live" ? "live" : "sandbox";

export const PAYPAL_BASE =
  ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

/** ¿Están las credenciales de servidor presentes? */
export function paypalConfigured(): boolean {
  return Boolean(
    process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET,
  );
}

/** Mapea un plan_id de PayPal al intervalo interno, o null si no coincide. */
export function intervalForPlan(planId: string | undefined | null) {
  if (!planId) return null;
  if (planId === process.env.NEXT_PUBLIC_PAYPAL_PLAN_MONTHLY) return "monthly";
  if (planId === process.env.NEXT_PUBLIC_PAYPAL_PLAN_ANNUAL) return "annual";
  return null;
}

async function getAccessToken(): Promise<string> {
  const id = process.env.PAYPAL_CLIENT_ID!;
  const secret = process.env.PAYPAL_CLIENT_SECRET!;
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`PayPal: no se pudo obtener token (${res.status})`);
  }
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

export type PayPalSubscription = {
  id: string;
  status: string; // APPROVAL_PENDING | APPROVED | ACTIVE | SUSPENDED | CANCELLED | EXPIRED
  plan_id?: string;
  billing_info?: { next_billing_time?: string };
};

/** Trae el detalle de una suscripción, o null si falla. */
export async function getSubscription(
  id: string,
): Promise<PayPalSubscription | null> {
  const token = await getAccessToken();
  const res = await fetch(`${PAYPAL_BASE}/v1/billing/subscriptions/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as PayPalSubscription;
}

/** Cancela una suscripción. Devuelve true si PayPal la aceptó (204). */
export async function cancelSubscription(
  id: string,
  reason = "Cancelada por el usuario",
): Promise<boolean> {
  const token = await getAccessToken();
  const res = await fetch(
    `${PAYPAL_BASE}/v1/billing/subscriptions/${id}/cancel`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason }),
    },
  );
  return res.ok;
}

/** Verifica la firma de un webhook contra PAYPAL_WEBHOOK_ID. */
export async function verifyWebhookSignature(
  headers: Headers,
  rawBody: string,
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return false;
  const token = await getAccessToken();
  const res = await fetch(
    `${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auth_algo: headers.get("paypal-auth-algo"),
        cert_url: headers.get("paypal-cert-url"),
        transmission_id: headers.get("paypal-transmission-id"),
        transmission_sig: headers.get("paypal-transmission-sig"),
        transmission_time: headers.get("paypal-transmission-time"),
        webhook_id: webhookId,
        webhook_event: JSON.parse(rawBody),
      }),
      cache: "no-store",
    },
  );
  if (!res.ok) return false;
  const json = (await res.json()) as { verification_status: string };
  return json.verification_status === "SUCCESS";
}
