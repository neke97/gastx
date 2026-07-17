import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSubscription, verifyWebhookSignature } from "@/lib/paypal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WebhookEvent = {
  event_type: string;
  resource?: {
    id?: string;
    status?: string;
    billing_agreement_id?: string; // en eventos de pago (PAYMENT.SALE.*)
    billing_info?: { next_billing_time?: string };
  };
};

/**
 * Recibe eventos de PayPal y mantiene el estado de la suscripción en profiles.
 * Verifica la firma con PAYPAL_WEBHOOK_ID antes de procesar.
 */
export async function POST(request: Request) {
  const raw = await request.text();

  const verified = await verifyWebhookSignature(request.headers, raw);
  if (!verified) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  let event: WebhookEvent;
  try {
    event = JSON.parse(raw) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const admin = createAdminClient();
  const type = event.event_type;

  // ID de la suscripción según el tipo de evento.
  const subId =
    event.resource?.billing_agreement_id ?? event.resource?.id ?? null;
  if (!subId) return NextResponse.json({ ok: true, ignored: type });

  const updateBySub = (patch: Record<string, unknown>) =>
    admin.from("profiles").update(patch).eq("paypal_subscription_id", subId);

  switch (type) {
    case "BILLING.SUBSCRIPTION.ACTIVATED":
    case "BILLING.SUBSCRIPTION.RE-ACTIVATED":
    case "PAYMENT.SALE.COMPLETED": {
      // Pago/activación: refrescar fin de período desde PayPal.
      const sub = await getSubscription(subId);
      await updateBySub({
        access_active: true,
        subscription_status: "active",
        current_period_end: sub?.billing_info?.next_billing_time ?? null,
      });
      break;
    }
    case "BILLING.SUBSCRIPTION.CANCELLED":
      // El acceso continúa hasta current_period_end (no se revoca ya).
      await updateBySub({ subscription_status: "cancelled" });
      break;
    case "BILLING.SUBSCRIPTION.SUSPENDED":
      await updateBySub({ subscription_status: "suspended" });
      break;
    case "BILLING.SUBSCRIPTION.EXPIRED":
    case "PAYMENT.SALE.DENIED":
      await updateBySub({
        subscription_status: "expired",
        access_active: false,
      });
      break;
    default:
      return NextResponse.json({ ok: true, ignored: type });
  }

  return NextResponse.json({ ok: true });
}
