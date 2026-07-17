-- =====================================================================
-- GastX — Migración 0009: moneda por grupo (multi-moneda en grupos)
-- Cada grupo maneja UNA moneda (evita ambigüedad de tasas entre miembros).
-- Al crear, toma la moneda base del creador.
-- Aplicar en Supabase: SQL Editor -> pegar -> Run
-- =====================================================================

alter table public.groups
  add column if not exists currency text not null default 'CRC';

-- Recrear create_group para fijar la moneda del grupo = base del creador.
create or replace function public.create_group(p_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_cur text;
begin
  if coalesce(trim(p_name), '') = '' then raise exception 'El nombre es obligatorio'; end if;
  select coalesce(default_currency, 'CRC') into v_cur
    from public.profiles where id = auth.uid();
  insert into public.groups (name, owner_id, currency)
    values (trim(p_name), auth.uid(), coalesce(v_cur, 'CRC'))
    returning id into v_id;
  insert into public.group_members (group_id, user_id, role)
    values (v_id, auth.uid(), 'owner');
  return v_id;
end;
$$;
