-- =====================================================================
-- GastX — Migración 0011: recurrencia opcional + hora en movimientos
-- - recurring_templates: frequency y next_run_on pasan a NULLABLE (una plantilla
--   puede ser solo un "atajo" sin repetición automática).
-- - transactions: columna opcional occurred_at (fecha+hora) para registrar hora.
-- Aplicar en Supabase: SQL Editor -> pegar -> Run
-- =====================================================================

alter table public.recurring_templates alter column frequency drop not null;
alter table public.recurring_templates alter column next_run_on drop not null;

alter table public.transactions
  add column if not exists occurred_at timestamptz;
