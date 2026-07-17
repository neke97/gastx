-- =====================================================================
-- GastX — Migración 0006: grupos compartidos reales (Fase 7, parte 1)
-- groups, group_members, group_invites + RLS + funciones security definer.
-- Las MUTACIONES pasan por funciones (create/invite/accept/…); las tablas solo
-- tienen políticas de SELECT. Las funciones son SECURITY DEFINER (evitan la
-- recursión de RLS al chequear membresía) y validan autorización en código.
-- Aplicar en Supabase: SQL Editor -> pegar -> Run
-- =====================================================================

-- ---------- Tablas ----------
create table if not exists public.groups (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  owner_id   uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  role       text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  unique (group_id, user_id)
);
create index if not exists group_members_user_idx on public.group_members (user_id);
create index if not exists group_members_group_idx on public.group_members (group_id);

create table if not exists public.group_invites (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups (id) on delete cascade,
  email      text not null,
  invited_by uuid not null references public.profiles (id) on delete cascade,
  status     text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  unique (group_id, email)
);
create index if not exists group_invites_email_idx on public.group_invites (email);

-- ---------- Funciones de apoyo (SECURITY DEFINER, sin recursión de RLS) ----------
create or replace function public.is_group_member(gid uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.group_members
    where group_id = gid and user_id = auth.uid()
  );
$$;

create or replace function public.is_group_owner(gid uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.groups where id = gid and owner_id = auth.uid()
  );
$$;

create or replace function public.shares_group(other uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.group_members a
    join public.group_members b on a.group_id = b.group_id
    where a.user_id = auth.uid() and b.user_id = other
  );
$$;

-- ---------- RLS: solo SELECT (las mutaciones van por funciones) ----------
alter table public.groups enable row level security;
create policy "groups_select_member" on public.groups
  for select using (public.is_group_member(id));

alter table public.group_members enable row level security;
create policy "group_members_select" on public.group_members
  for select using (public.is_group_member(group_id));

alter table public.group_invites enable row level security;
create policy "group_invites_select" on public.group_invites
  for select using (
    public.is_group_member(group_id)
    or lower(email) = lower(auth.jwt() ->> 'email')
  );

-- Los miembros de un grupo pueden ver el perfil (display_name) de sus compañeros.
create policy "profiles_select_group" on public.profiles
  for select using (public.shares_group(id));

-- ---------- Funciones de mutación (SECURITY DEFINER) ----------
create or replace function public.create_group(p_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if coalesce(trim(p_name), '') = '' then raise exception 'El nombre es obligatorio'; end if;
  insert into public.groups (name, owner_id) values (trim(p_name), auth.uid())
    returning id into v_id;
  insert into public.group_members (group_id, user_id, role)
    values (v_id, auth.uid(), 'owner');
  return v_id;
end;
$$;

create or replace function public.rename_group(p_group uuid, p_name text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_group_owner(p_group) then raise exception 'Solo el dueño puede renombrar'; end if;
  if coalesce(trim(p_name), '') = '' then raise exception 'El nombre es obligatorio'; end if;
  update public.groups set name = trim(p_name) where id = p_group;
end;
$$;

create or replace function public.invite_to_group(p_group uuid, p_email text)
returns void language plpgsql security definer set search_path = public as $$
declare v_email text := lower(trim(p_email));
begin
  if not public.is_group_member(p_group) then raise exception 'No sos miembro del grupo'; end if;
  if v_email = '' then raise exception 'Correo inválido'; end if;
  insert into public.group_invites (group_id, email, invited_by, status)
    values (p_group, v_email, auth.uid(), 'pending')
  on conflict (group_id, email)
    do update set status = 'pending', invited_by = auth.uid();
end;
$$;

create or replace function public.accept_group_invite(p_invite uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_group uuid; v_email text; v_status text;
begin
  select group_id, lower(email), status into v_group, v_email, v_status
    from public.group_invites where id = p_invite;
  if v_group is null then raise exception 'Invitación no encontrada'; end if;
  if v_email <> lower(auth.jwt() ->> 'email') then raise exception 'No autorizado'; end if;
  if v_status <> 'pending' then raise exception 'La invitación ya no está pendiente'; end if;
  insert into public.group_members (group_id, user_id, role)
    values (v_group, auth.uid(), 'member')
  on conflict (group_id, user_id) do nothing;
  update public.group_invites set status = 'accepted' where id = p_invite;
end;
$$;

create or replace function public.decline_group_invite(p_invite uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_email text;
begin
  select lower(email) into v_email from public.group_invites where id = p_invite;
  if v_email is null then raise exception 'Invitación no encontrada'; end if;
  if v_email <> lower(auth.jwt() ->> 'email') then raise exception 'No autorizado'; end if;
  update public.group_invites set status = 'declined' where id = p_invite;
end;
$$;

create or replace function public.leave_group(p_group uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if public.is_group_owner(p_group) then
    raise exception 'El dueño no puede salir; borrá el grupo o transferí la propiedad.';
  end if;
  delete from public.group_members where group_id = p_group and user_id = auth.uid();
end;
$$;

create or replace function public.remove_group_member(p_group uuid, p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_group_owner(p_group) then raise exception 'Solo el dueño puede quitar miembros'; end if;
  delete from public.group_members
    where group_id = p_group and user_id = p_user and role <> 'owner';
end;
$$;

create or replace function public.delete_group(p_group uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_group_owner(p_group) then raise exception 'Solo el dueño puede borrar el grupo'; end if;
  delete from public.groups where id = p_group; -- cascada a miembros e invitaciones
end;
$$;

-- ---------- Permisos de ejecución ----------
grant execute on function public.create_group(text) to authenticated;
grant execute on function public.rename_group(uuid, text) to authenticated;
grant execute on function public.invite_to_group(uuid, text) to authenticated;
grant execute on function public.accept_group_invite(uuid) to authenticated;
grant execute on function public.decline_group_invite(uuid) to authenticated;
grant execute on function public.leave_group(uuid) to authenticated;
grant execute on function public.remove_group_member(uuid, uuid) to authenticated;
grant execute on function public.delete_group(uuid) to authenticated;
