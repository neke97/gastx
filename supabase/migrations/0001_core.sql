-- =====================================================================
-- GastX — Migración 0001: tablas núcleo (Fase 1)
-- profiles, categories, transactions + RLS + categorías por defecto
-- Aplicar en Supabase: SQL Editor -> pegar -> Run
-- =====================================================================

-- ---------------------------------------------------------------------
-- profiles: extiende auth.users (1:1)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  display_name     text,
  default_currency text        not null default 'CRC',
  locale           text        not null default 'es-CR',
  created_at       timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());
create policy "profiles_insert_own" on public.profiles
  for insert with check (id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ---------------------------------------------------------------------
-- categories: categorías de gasto/ingreso por usuario
-- ---------------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  name        text not null,
  kind        text not null check (kind in ('expense', 'income')),
  icon        text,
  color       text,
  is_archived boolean     not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists categories_user_idx on public.categories (user_id);

alter table public.categories enable row level security;

create policy "categories_all_own" on public.categories
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- transactions: cada gasto o ingreso (columnas núcleo de Fase 1;
-- recurring_template_id / installment_plan_id se agregan en fases 3 y 4)
-- ---------------------------------------------------------------------
create table if not exists public.transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  kind        text          not null check (kind in ('expense', 'income')),
  amount      numeric(14, 2) not null check (amount > 0),
  currency    text          not null default 'CRC',
  category_id uuid references public.categories (id) on delete set null,
  description text,
  occurred_on date          not null default current_date,
  created_at  timestamptz   not null default now()
);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, occurred_on desc);
create index if not exists transactions_user_category_idx
  on public.transactions (user_id, category_id);

alter table public.transactions enable row level security;

create policy "transactions_all_own" on public.transactions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- Categorías por defecto: se crean para cada usuario nuevo
-- ---------------------------------------------------------------------
create or replace function public.seed_default_categories(uid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.categories (user_id, name, kind, icon, color) values
    (uid, 'Salario',        'income',  'wallet',        '#059669'),
    (uid, 'Otros ingresos', 'income',  'plus-circle',   '#10b981'),
    (uid, 'Comida',         'expense', 'utensils',      '#f59e0b'),
    (uid, 'Transporte',     'expense', 'bus',           '#3b82f6'),
    (uid, 'Casa',           'expense', 'home',          '#8b5cf6'),
    (uid, 'Servicios',      'expense', 'plug',          '#06b6d4'),
    (uid, 'Salud',          'expense', 'heart-pulse',   '#ef4444'),
    (uid, 'Entretenimiento','expense', 'party-popper',  '#ec4899'),
    (uid, 'Compras',        'expense', 'shopping-bag',  '#f97316'),
    (uid, 'Educación',      'expense', 'graduation-cap','#6366f1'),
    (uid, 'Otros',          'expense', 'ellipsis',      '#64748b');
end;
$$;

-- ---------------------------------------------------------------------
-- Al registrarse un usuario: crear su profile y sus categorías por defecto
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  perform public.seed_default_categories(new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
