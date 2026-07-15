/** Helpers de formato para moneda y fechas (locale es-CR). */

const CURRENCY_LOCALE = "es-CR";
const DEFAULT_CURRENCY = "CRC";

/** Formatea un monto como colones: 12345 -> "₡12 345,00" */
export function formatMoney(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
): string {
  return new Intl.NumberFormat(CURRENCY_LOCALE, {
    style: "currency",
    currency,
  }).format(amount);
}

/** Formatea una fecha (Date o ISO string) como "15 jul 2026". */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(CURRENCY_LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}
