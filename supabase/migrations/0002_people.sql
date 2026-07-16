-- =====================================================================
-- GastX — Migración 0002: personas (Fase 2)
-- "Personas como etiquetas" para dividir gastos. En una fase futura se
-- podrán enlazar a usuarios reales (linked_user_id).
-- Aplicar en Supabase: SQL Editor -> pegar -> Run
-- =====================================================================

create table if not exists public.people (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  name           text not null,
  linked_user_id uuid references auth.users (id) on delete set null, -- futuro: grupos reales
  created_at     timestamptz not null default now()
);

create index if not exists people_user_idx on public.people (user_id);

alter table public.people enable row level security;

create policy "people_all_own" on public.people
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
