-- =====================================================================
-- GastX — Migración 0012: cerrar hueco RLS al insertar transacciones de grupo
-- La política de escritura ahora exige que, si hay group_id, seas miembro del
-- grupo (antes solo validaba user_id = auth.uid()).
-- Aplicar en Supabase: SQL Editor -> pegar -> Run
-- =====================================================================

drop policy if exists "transactions_all_own" on public.transactions;

create policy "transactions_all_own" on public.transactions
  for all
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (group_id is null or public.is_group_member(group_id))
  );
