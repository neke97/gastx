import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSubscription, intervalForPlan } from "@/lib/paypal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Activa la suscripción del usuario autenticado tras la aprobación en PayPal.
 * El cliente manda { subscriptionID }; verificamos contra PayPal que esté
 * ACTIVE y que el plan sea uno nuestro antes de activar el acceso.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let subscriptionID: string | undefined;
  try {
    const body = (await request.json()) as { subscriptionID?: string };
    subscriptionID = body.subscriptionID;
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!subscriptionID) {
    return NextResponse.json({ error: "missing_subscription" }, { status: 400 });
  }

  const sub = await getSubscription(subscriptionID);
  if (!sub) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (sub.status !== "ACTIVE" && sub.status !== "APPROVED") {
    return NextResponse.json(
      { error: "not_active", status: sub.status },
      { status: 409 },
    );
  }

  const interval = intervalForPlan(sub.plan_id);
  if (!interval) {
    return NextResponse.json({ error: "unknown_plan" }, { status: 409 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      access_active: true,
      plan: "pro",
      subscription_status: "active",
      plan_interval: interval,
      paypal_subscription_id: sub.id,
      current_period_end: sub.billing_info?.next_billing_time ?? null,
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
