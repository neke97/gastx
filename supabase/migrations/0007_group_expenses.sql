-- =====================================================================
-- GastX — Migración 0007: gastos compartidos de grupo (Fase 7, parte 2)
-- transactions.group_id + splits por miembro real + RLS de visibilidad grupal.
-- Aplicar en Supabase: SQL Editor -> pegar -> Run
-- =====================================================================

-- Una transacción puede pertenecer a un grupo (el pagador es user_id).
alter table public.transactions
  add column if not exists group_id uuid references public.groups (id) on delete set null;

create index if not exists transactions_group_idx on public.transactions (group_id);

-- Los miembros del grupo pueden VER las transacciones del grupo.
create policy "transactions_select_group" on public.transactions
  for select using (
    group_id is not null and public.is_group_member(group_id)
  );

-- Los splits ahora pueden apuntar a un miembro real (member_user_id) en vez de a
-- una persona-etiqueta (person_id). Exactamente uno de los dos.
alter table public.transaction_splits alter column person_id drop not null;

alter table public.transaction_splits
  add column if not exists member_user_id uuid references public.profiles (id) on delete cascade;

alter table public.transaction_splits
  drop constraint if exists transaction_splits_target_chk;
alter table public.transaction_splits
  add constraint transaction_splits_target_chk check (
    (person_id is not null and member_user_id is null)
    or (person_id is null and member_user_id is not null)
  );

-- Los miembros del grupo pueden VER los splits de las transacciones del grupo.
create policy "transaction_splits_select_group" on public.transaction_splits
  for select using (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_id
        and t.group_id is not null
        and public.is_group_member(t.group_id)
    )
  );
