-- =====================================================================
-- GastX — Migración 0014: suscripciones PayPal
-- Guarda el estado de la suscripción en profiles. El acceso se calcula con
-- access_active + current_period_end (ver src/lib/access.ts):
--   - promo/legacy: current_period_end NULL => acceso mientras access_active.
--   - suscripción: acceso hasta current_period_end (se corre con cada pago).
-- El webhook (service_role) mantiene estos campos en sync.
-- Aplicar en Supabase: SQL Editor -> pegar -> Run
-- =====================================================================

alter table public.profiles
  add column if not exists paypal_subscription_id text,
  add column if not exists subscription_status    text,        -- active | cancelled | suspended | expired
  add column if not exists plan_interval           text,        -- monthly | annual
  add column if not exists current_period_end      timestamptz;

create index if not exists profiles_paypal_sub_idx
  on public.profiles (paypal_subscription_id);
