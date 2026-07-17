-- =====================================================================
-- GastX — Migración 0013: acceso por suscripción / código promocional
-- Añade estado de acceso al profile, tabla de códigos promocionales y una
-- función SECURITY DEFINER para canjearlos de forma segura.
-- Aplicar en Supabase: SQL Editor -> pegar -> Run
-- =====================================================================

-- ---------------------------------------------------------------------
-- profiles: estado de acceso
--   access_active  -> true si la cuenta puede usar la app
--   plan           -> 'free' | 'promo' | 'pro' (a futuro planes pagos)
--   activated_at   -> cuándo se activó el acceso
--   promo_code     -> código usado para activar (si aplica)
-- ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists access_active boolean     not null default false,
  add column if not exists plan          text        not null default 'free',
  add column if not exists activated_at  timestamptz,
  add column if not exists promo_code    text;

-- Cuentas ya existentes: dejarlas activas para no bloquear al dueño actual.
update public.profiles
  set access_active = true,
      plan = coalesce(nullif(plan, 'free'), 'legacy'),
      activated_at = coalesce(activated_at, now())
  where access_active = false;

-- ---------------------------------------------------------------------
-- promo_codes: códigos que activan el acceso.
--   max_uses null = usos ilimitados. RLS activo SIN políticas => los
--   clientes no pueden leerlos ni tocarlos; solo la función de canje
--   (SECURITY DEFINER) opera sobre esta tabla.
-- ---------------------------------------------------------------------
create table if not exists public.promo_codes (
  code       text primary key,
  max_uses   int,
  uses       int         not null default 0,
  active     boolean     not null default true,
  created_at timestamptz not null default now()
);

alter table public.promo_codes enable row level security;

-- Código provisional (usos ilimitados). Cambiar/desactivar cuando toque.
insert into public.promo_codes (code, max_uses) values ('123456', null)
  on conflict (code) do nothing;

-- ---------------------------------------------------------------------
-- redeem_promo_code: valida el código, incrementa su contador y activa
-- el acceso del usuario autenticado. Devuelve true si se canjeó.
-- ---------------------------------------------------------------------
create or replace function public.redeem_promo_code(p_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ok boolean;
begin
  update public.promo_codes
    set uses = uses + 1
    where code = p_code
      and active = true
      and (max_uses is null or uses < max_uses)
    returning true into v_ok;

  if coalesce(v_ok, false) then
    update public.profiles
      set access_active = true,
          plan = 'promo',
          activated_at = now(),
          promo_code = p_code
      where id = auth.uid();
    return true;
  end if;

  return false;
end;
$$;

grant execute on function public.redeem_promo_code(text) to authenticated;
