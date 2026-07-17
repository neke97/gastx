import { formatMoney } from "@/lib/format";

export type TrendPoint = { label: string; value: number };

const LINE = "#0d9488"; // teal (coherente con los otros gráficos)

/**
 * Línea de tendencia del balance neto por mes (una sola serie, sin leyenda:
 * el título la nombra). Escala en SVG con viewBox para adaptarse al ancho.
 */
export function BalanceTrend({
  data,
  currency = "CRC",
}: {
  data: TrendPoint[];
  currency?: string;
}) {
  const H = 100;
  const W = 100;
  const values = data.map((d) => d.value);
  const max = Math.max(0, ...values);
  const min = Math.min(0, ...values);
  const range = max - min || 1;

  const n = data.length;
  const x = (i: number) => (n <= 1 ? W / 2 : (i / (n - 1)) * W);
  const y = (v: number) => H - ((v - min) / range) * H;
  const y0 = y(0);

  const points = data.map((d, i) => `${x(i)},${y(d.value)}`).join(" ");

  return (
    <div className="flex flex-col gap-2">
      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="h-32 w-full"
          role="img"
          aria-label="Tendencia del balance neto por mes"
        >
          {/* Línea base en cero */}
          <line
            x1="0"
            y1={y0}
            x2={W}
            y2={y0}
            stroke="currentColor"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            className="text-black/20 dark:text-white/20"
            strokeDasharray="3 3"
          />
          {n > 1 && (
            <polyline
              points={points}
              fill="none"
              stroke={LINE}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}
          {data.map((d, i) => (
            <circle
              key={d.label}
              cx={x(i)}
              cy={y(d.value)}
              r="2.5"
              fill={LINE}
              vectorEffect="non-scaling-stroke"
            >
              <title>{`${d.label}: ${formatMoney(d.value, currency)}`}</title>
            </circle>
          ))}
        </svg>
      </div>
      <div className="flex justify-between text-xs text-black/50 dark:text-white/50">
        {data.map((d) => (
          <span key={d.label} className="flex-1 text-center">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
