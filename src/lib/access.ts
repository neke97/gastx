/**
 * Cálculo central de acceso a la app.
 *
 * - promo / legacy / lifetime: `current_period_end` NULL => acceso mientras
 *   `access_active` sea true.
 * - suscripción PayPal: acceso hasta `current_period_end` (cada pago la corre
 *   hacia adelante; al cancelar, el acceso dura hasta esa fecha y luego expira).
 */

export type AccessProfile = {
  access_active: boolean | null;
  current_period_end: string | null;
} | null;

export function hasAccess(p: AccessProfile): boolean {
  if (!p?.access_active) return false;
  if (!p.current_period_end) return true; // promo / legacy / de por vida
  return new Date(p.current_period_end).getTime() >= Date.now();
}

/** Columnas mínimas a seleccionar de profiles para evaluar el acceso. */
export const ACCESS_COLUMNS = "access_active, current_period_end";
