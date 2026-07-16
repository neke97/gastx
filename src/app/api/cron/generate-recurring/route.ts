import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function toYMD(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function addPeriod(ymd: string, frequency: string, interval: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (frequency === "daily") date.setDate(date.getDate() + interval);
  else if (frequency === "weekly") date.setDate(date.getDate() + interval * 7);
  else if (frequency === "monthly") date.setMonth(date.getMonth() + interval);
  else if (frequency === "yearly")
    date.setFullYear(date.getFullYear() + interval);
  return toYMD(date);
}

/**
 * Cron: genera las transacciones pendientes de TODAS las recurrentes activas.
 * Lo llama Vercel Cron (ver vercel.json). Protegido con CRON_SECRET.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    auth !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = toYMD(new Date());

  const { data: templates, error } = await supabase
    .from("recurring_templates")
    .select("*")
    .eq("is_active", true)
    .lte("next_run_on", today);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let created = 0;
  for (const t of templates ?? []) {
    let runOn: string = t.next_run_on;
    const toInsert: Record<string, unknown>[] = [];
    let guard = 0;
    while (runOn <= today && guard < 400) {
      toInsert.push({
        user_id: t.user_id,
        kind: t.kind,
        amount: t.amount,
        currency: t.currency,
        category_id: t.category_id,
        description: t.name,
        occurred_on: runOn,
        recurring_template_id: t.id,
      });
      runOn = addPeriod(runOn, t.frequency, t.interval);
      guard++;
    }
    if (toInsert.length > 0) {
      const { error: insErr } = await supabase
        .from("transactions")
        .insert(toInsert);
      if (!insErr) {
        created += toInsert.length;
        await supabase
          .from("recurring_templates")
          .update({ next_run_on: runOn })
          .eq("id", t.id);
      }
    }
  }

  return NextResponse.json({ ok: true, created });
}
