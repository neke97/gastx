-- =====================================================================
-- GastX — Migración 0003: división de gastos (Fase 2)
-- transaction_splits: reparte una transacción entre personas por monto o %.
-- Regla: sum(amount_resolved) debe cuadrar con transactions.amount.
-- Aplicar en Supabase: SQL Editor -> pegar -> Run
-- =====================================================================

create table if not exists public.transaction_splits (
  id              uuid primary key default gen_random_uuid(),
  transaction_id  uuid not null references public.transactions (id) on delete cascade,
  person_id       uuid not null references public.people (id) on delete cascade,
  split_mode      text not null check (split_mode in ('amount', 'percent')),
  value           numeric(14, 2) not null check (value >= 0),  -- monto o % según split_mode
  amount_resolved numeric(14, 2) not null check (amount_resolved >= 0),
  created_at      timestamptz not null default now()
);

create index if not exists transaction_splits_tx_idx
  on public.transaction_splits (transaction_id);

alter table public.transaction_splits enable row level security;

-- Sin user_id propio: la propiedad se valida contra la transacción padre.
create policy "splits_all_own" on public.transaction_splits
  for all
  using (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_id and t.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_id and t.user_id = auth.uid()
    )
  );
