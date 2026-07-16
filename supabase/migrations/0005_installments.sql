-- =====================================================================
-- GastX — Migración 0005: compras a cuotas (Fase 4)
-- installment_plans: un plan de pago a plazos.
-- installment_payments: cada cuota del plan.
-- Aplicar en Supabase: SQL Editor -> pegar -> Run
-- =====================================================================

create table if not exists public.installment_plans (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles (id) on delete cascade,
  name               text not null,
  total_amount       numeric(14, 2) not null check (total_amount > 0),
  installments_count int  not null check (installments_count >= 1),
  installment_amount numeric(14, 2) not null check (installment_amount > 0),
  currency           text not null default 'CRC',
  category_id        uuid references public.categories (id) on delete set null,
  start_date         date not null,
  frequency          text not null default 'monthly'
                       check (frequency in ('weekly', 'monthly', 'yearly')),
  is_completed       boolean not null default false,
  created_at         timestamptz not null default now()
);

create index if not exists installment_plans_user_idx
  on public.installment_plans (user_id);

alter table public.installment_plans enable row level security;

create policy "installment_plans_all_own" on public.installment_plans
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Cada cuota del plan.
create table if not exists public.installment_payments (
  id                  uuid primary key default gen_random_uuid(),
  installment_plan_id uuid not null references public.installment_plans (id) on delete cascade,
  number              int  not null,
  due_date            date not null,
  amount              numeric(14, 2) not null check (amount >= 0),
  paid_on             date,
  transaction_id      uuid references public.transactions (id) on delete set null,
  created_at          timestamptz not null default now()
);

create index if not exists installment_payments_plan_idx
  on public.installment_payments (installment_plan_id);

alter table public.installment_payments enable row level security;

create policy "installment_payments_all_own" on public.installment_payments
  for all
  using (
    exists (
      select 1 from public.installment_plans p
      where p.id = installment_plan_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.installment_plans p
      where p.id = installment_plan_id and p.user_id = auth.uid()
    )
  );

-- Vincular transacciones con el plan de cuotas (trazabilidad).
alter table public.transactions
  add column if not exists installment_plan_id uuid
    references public.installment_plans (id) on delete set null;
