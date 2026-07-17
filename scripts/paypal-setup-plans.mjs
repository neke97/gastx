// =====================================================================
// GastX — Crea el producto y los planes de suscripción en PayPal.
//
// Uso:
//   1. Poné PAYPAL_ENV, PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET en .env.local
//      (o exportalos en el entorno).
//   2. node scripts/paypal-setup-plans.mjs
//   3. Copiá los IDs (P-...) que imprime a NEXT_PUBLIC_PAYPAL_PLAN_MONTHLY y
//      NEXT_PUBLIC_PAYPAL_PLAN_ANNUAL en .env.local y en Vercel.
//
// PayPal no cobra en CRC; los montos van en USD (equivalente a ₡500 / ₡5.000).
// Editá MONTHLY_USD / ANNUAL_USD si querés otros precios.
// =====================================================================

import { readFileSync } from "node:fs";

const MONTHLY_USD = "0.95"; // ≈ ₡500
const ANNUAL_USD = "9.50"; // ≈ ₡5.000

// --- Cargar variables desde .env.local si existen (sin dependencias) ---
try {
  const txt = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of txt.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
} catch {
  // sin .env.local: se usan las variables ya presentes en el entorno
}

const ENV = process.env.PAYPAL_ENV === "live" ? "live" : "sandbox";
const BASE =
  ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "Faltan PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET (ponelos en .env.local).",
  );
  process.exit(1);
}

async function token() {
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`token ${res.status}: ${await res.text()}`);
  return (await res.json()).access_token;
}

async function api(t, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${t}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${path} ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

function planBody(productId, name, unit, value) {
  return {
    product_id: productId,
    name,
    status: "ACTIVE",
    billing_cycles: [
      {
        frequency: { interval_unit: unit, interval_count: 1 },
        tenure_type: "REGULAR",
        sequence: 1,
        total_cycles: 0, // ilimitado
        pricing_scheme: {
          fixed_price: { value, currency_code: "USD" },
        },
      },
    ],
    payment_preferences: {
      auto_bill_outstanding: true,
      setup_fee_failure_action: "CONTINUE",
      payment_failure_threshold: 1,
    },
  };
}

async function main() {
  console.log(`PayPal env: ${ENV}`);
  const t = await token();

  const product = await api(t, "/v1/catalogs/products", {
    name: "GastX Pro",
    description: "Acceso completo a GastX",
    type: "SERVICE",
    category: "SOFTWARE",
  });
  console.log("Producto:", product.id);

  const monthly = await api(
    t,
    "/v1/billing/plans",
    planBody(product.id, "GastX Pro Mensual", "MONTH", MONTHLY_USD),
  );
  const annual = await api(
    t,
    "/v1/billing/plans",
    planBody(product.id, "GastX Pro Anual", "YEAR", ANNUAL_USD),
  );

  console.log("\n=== Copiá esto a .env.local y a Vercel ===");
  console.log(`NEXT_PUBLIC_PAYPAL_PLAN_MONTHLY=${monthly.id}`);
  console.log(`NEXT_PUBLIC_PAYPAL_PLAN_ANNUAL=${annual.id}`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
