import { formatMoney } from "@/lib/format";

export type DonutSlice = { name: string; color: string; amount: number };

/**
 * Dona de composición (gastos por categoría). La identidad se refuerza con
 * leyenda + monto + %, no solo por color.
 */
export function CategoryDonut({
  slices,
  total,
}: {
  slices: DonutSlice[];
  total: number;
}) {
  const size = 176;
  const stroke = 26;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const C = 2 * Math.PI * r;
  const gap = total > 0 ? 2 : 0; // separación de 2px entre segmentos

  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="shrink-0"
        role="img"
        aria-label="Distribución de gastos por categoría"
      >
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-black/[0.06] dark:text-white/[0.08]"
        />
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          {slices.map((s) => {
            const len = (s.amount / total) * C;
            const dash = Math.max(len - gap, 0.0001);
            const el = (
              <circle
                key={s.name}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${C - dash}`}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return el;
          })}
        </g>
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          className="fill-black/50 text-[10px] dark:fill-white/50"
        >
          Gastos
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          className="fill-black text-sm font-bold dark:fill-white"
        >
          {formatMoney(total)}
        </text>
      </svg>

      <ul className="flex w-full min-w-0 flex-1 flex-col gap-1.5 text-sm">
        {slices.map((s) => (
          <li key={s.name} className="flex items-center justify-between gap-3 py-0.5">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="truncate">{s.name}</span>
            </span>
            <span className="shrink-0 text-black/60 dark:text-white/60">
              {formatMoney(s.amount)}{" "}
              <span className="text-xs text-black/40 dark:text-white/40">
                ({Math.round((s.amount / total) * 100)}%)
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
