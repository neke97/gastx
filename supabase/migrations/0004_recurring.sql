-- =====================================================================
-- GastX — Migración 0004: movimientos recurrentes (Fase 3)
-- recurring_templates: plantillas (salario, mensualidad, pases de bus…).
-- recurring_amount_history: historial de cambios de precio.
-- Aplicar en Supabase: SQL Editor -> pegar -> Run
-- =====================================================================

create table if not exists public.recurring_templates (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  kind        text not null check (kind in ('expense', 'income')),
  name        text not null,
  amount      numeric(14, 2) not null check (amount > 0),
  currency    text not null default 'CRC',
  category_id uuid references public.categories (id) on delete set null,
  frequency   text not null check (frequency in ('daily', 'weekly', 'monthly', 'yearly')),
  interval    int  not null default 1 check (interval >= 1),
  next_run_on date not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists recurring_user_idx on public.recurring_templates (user_id);

alter table public.recurring_templates enable row level security;

create policy "recurring_all_own" on public.recurring_templates
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Historial de precios de una recurrente.
create table if not exists public.recurring_amount_history (
  id                    uuid primary key default gen_random_uuid(),
  recurring_template_id uuid not null references public.recurring_templates (id) on delete cascade,
  amount                numeric(14, 2) not null check (amount > 0),
  effective_from        date not null default current_date,
  created_at            timestamptz not null default now()
);

create index if not exists recurring_history_tpl_idx
  on public.recurring_amount_history (recurring_template_id);

alter table public.recurring_amount_history enable row level security;

-- Propiedad validada contra la plantilla padre.
create policy "recurring_history_all_own" on public.recurring_amount_history
  for all
  using (
    exists (
      select 1 from public.recurring_templates r
      where r.id = recurring_template_id and r.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.recurring_templates r
      where r.id = recurring_template_id and r.user_id = auth.uid()
    )
  );

-- Vincular transacciones generadas con su plantilla (opcional, para trazabilidad).
alter table public.transactions
  add column if not exists recurring_template_id uuid
    references public.recurring_templates (id) on delete set null;
