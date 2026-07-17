import { formatMoney } from "@/lib/format";

export type TopExpense = {
  id: string;
  label: string;
  icon: string;
  color: string;
  date: string;
  amount: number;
};

/**
 * Mayores gastos individuales del mes como barras horizontales
 * (identidad por ícono + etiqueta + color; valor con label directo).
 */
export function TopExpensesBars({
  items,
  currency = "CRC",
}: {
  items: TopExpense[];
  currency?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.amount));

  return (
    <ul className="flex flex-col gap-3">
      {items.map((e) => (
        <li key={e.id} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span className="text-base leading-none">{e.icon}</span>
              <span className="truncate">{e.label}</span>
            </span>
            <span className="shrink-0 font-semibold text-red-600 dark:text-red-400">
              {formatMoney(e.amount, currency)}
            </span>
          </div>
          <div
            className="h-2.5 w-full overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/10"
            title={`${e.label}: ${formatMoney(e.amount, currency)}`}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max(4, (e.amount / max) * 100)}%`,
                backgroundColor: e.color,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
