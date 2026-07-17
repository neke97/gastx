-- =====================================================================
-- GastX — Migración 0010: íconos emoji para categorías
-- Actualiza las categorías existentes (nombres lucide -> emoji) y el seed de
-- categorías por defecto para usuarios nuevos.
-- Aplicar en Supabase: SQL Editor -> pegar -> Run
-- =====================================================================

-- Convertir íconos viejos (lucide) a emoji en datos existentes.
update public.categories set icon = case icon
  when 'wallet'         then '💰'
  when 'plus-circle'    then '➕'
  when 'utensils'       then '🍔'
  when 'bus'            then '🚌'
  when 'home'           then '🏠'
  when 'plug'           then '🔌'
  when 'heart-pulse'    then '🏥'
  when 'party-popper'   then '🎉'
  when 'shopping-bag'   then '🛍️'
  when 'graduation-cap' then '🎓'
  when 'ellipsis'       then '📦'
  else icon
end
where icon in ('wallet','plus-circle','utensils','bus','home','plug',
               'heart-pulse','party-popper','shopping-bag','graduation-cap','ellipsis');

-- Recrear el seed con emoji (para nuevos usuarios).
create or replace function public.seed_default_categories(uid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.categories (user_id, name, kind, icon, color) values
    (uid, 'Salario',        'income',  '💰', '#059669'),
    (uid, 'Otros ingresos', 'income',  '➕', '#10b981'),
    (uid, 'Comida',         'expense', '🍔', '#f59e0b'),
    (uid, 'Transporte',     'expense', '🚌', '#3b82f6'),
    (uid, 'Casa',           'expense', '🏠', '#8b5cf6'),
    (uid, 'Servicios',      'expense', '🔌', '#06b6d4'),
    (uid, 'Salud',          'expense', '🏥', '#ef4444'),
    (uid, 'Entretenimiento','expense', '🎉', '#ec4899'),
    (uid, 'Compras',        'expense', '🛍️', '#f97316'),
    (uid, 'Educación',      'expense', '🎓', '#6366f1'),
    (uid, 'Otros',          'expense', '📦', '#64748b');
end;
$$;
