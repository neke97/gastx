/** Utilidades de multi-moneda. */

/** Monedas comunes ofrecidas en los selectores (ISO 4217). */
export const COMMON_CURRENCIES = [
  "CRC",
  "USD",
  "EUR",
  "MXN",
  "GBP",
  "CAD",
  "COP",
  "GTQ",
  "PAB",
  "NIO",
] as const;

export type RateMap = Record<string, number>;

/**
 * Convierte un monto a la moneda base usando el mapa de tasas
 * (rate_to_base = cuántas unidades base vale 1 unidad de esa moneda).
 * Si la moneda es la base, no convierte. Si falta la tasa, asume 1:1.
 */
export function toBase(
  amount: number,
  currency: string,
  base: string,
  rates: RateMap,
): number {
  if (!currency || currency === base) return amount;
  const r = rates[currency];
  return r ? amount * r : amount;
}

/** Construye el mapa de tasas desde las filas de exchange_rates. */
export function buildRateMap(
  rows: { code: string; rate_to_base: number }[] | null | undefined,
): RateMap {
  const map: RateMap = {};
  for (const r of rows ?? []) map[r.code] = Number(r.rate_to_base);
  return map;
}

/** Lista de monedas disponibles para elegir: base primero, luego las con tasa. */
export function availableCurrencies(base: string, rates: RateMap): string[] {
  const codes = [base, ...Object.keys(rates).filter((c) => c !== base)];
  return [...new Set(codes)];
}
