-- =====================================================================
-- GastX — Migración 0008: tipos de cambio (multi-moneda)
-- La moneda base vive en profiles.default_currency (ya existe).
-- exchange_rates guarda, por usuario, cuántas unidades de la moneda base
-- vale 1 unidad de otra moneda (rate_to_base). Ej: base CRC, USD -> 525.
-- Aplicar en Supabase: SQL Editor -> pegar -> Run
-- =====================================================================

create table if not exists public.exchange_rates (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  code         text not null,                 -- ISO 4217, ej. 'USD'
  rate_to_base numeric(18, 6) not null check (rate_to_base > 0),
  created_at   timestamptz not null default now(),
  unique (user_id, code)
);

create index if not exists exchange_rates_user_idx on public.exchange_rates (user_id);

alter table public.exchange_rates enable row level security;

create policy "exchange_rates_all_own" on public.exchange_rates
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
