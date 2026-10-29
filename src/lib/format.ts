/** Helpers de formato para moneda y fechas (locale es-CR). */

const CURRENCY_LOCALE = "es-CR";
const DEFAULT_CURRENCY = "CRC";

/**
 * Formatea un monto: 12345 -> "₡12 345"; 12345.5 -> "₡12 345,50".
 * Los céntimos solo se muestran si los hay (montos más limpios de leer).
 */
export function formatMoney(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
): string {
  const whole = Math.abs(Math.round(amount * 100)) % 100 === 0;
  return new Intl.NumberFormat(CURRENCY_LOCALE, {
    style: "currency",
    currency,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** "Hoy", "Ayer" o "lunes 26 oct" para agrupar movimientos por día. */
export function formatDayLabel(ymd: string, todayYmd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const [ty, tm, td] = todayYmd.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const diff = Math.round(
    (new Date(ty, tm - 1, td).getTime() - date.getTime()) / 86_400_000,
  );
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Ayer";
  const label = new Intl.DateTimeFormat(CURRENCY_LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "short",
    ...(y !== ty ? { year: "numeric" } : {}),
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Fecha de hoy (YYYY-MM-DD) en zona horaria de Costa Rica. */
export function todayCR(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(new Date());
}

/** Saludo según la hora en Costa Rica. */
export function greetingCR(): string {
  const h = Number(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: TIME_ZONE }).format(new Date()),
  );
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

const TIME_ZONE = "America/Costa_Rica";

/**
 * Formatea la hora de un timestamp como "14:30", en zona horaria de Costa Rica
 * (para que sea consistente aunque el servidor esté en UTC).
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(CURRENCY_LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TIME_ZONE,
  }).format(d);
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
