import { formatMoney } from "@/lib/format";

export type MonthDatum = {
  label: string;
  income: number;
  expense: number;
};

const INCOME = "#0d9488"; // teal — validado CVD (claro/oscuro)
const EXPENSE = "#e11d48"; // rosa — validado CVD

/**
 * Ingresos vs gastos por mes (barras agrupadas). Dos series → leyenda siempre
 * presente; abajo una tabla con los valores exactos (identidad no solo por color).
 */
export function MonthlyBars({ data }: { data: MonthDatum[] }) {
  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]));
  const chartH = 132;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: INCOME }}
          />
          Ingresos
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: EXPENSE }}
          />
          Gastos
        </span>
      </div>

      <div className="flex items-end justify-between gap-2" style={{ height: chartH }}>
        {data.map((d) => (
          <div
            key={d.label}
            className="flex h-full flex-1 flex-col items-center justify-end gap-1"
          >
            <div className="flex h-full w-full items-end justify-center gap-1">
              <div
                className="w-1/2 max-w-6 rounded-t"
                style={{
                  height: `${(d.income / max) * 100}%`,
                  backgroundColor: INCOME,
                }}
                title={`Ingresos: ${formatMoney(d.income)}`}
              />
              <div
                className="w-1/2 max-w-6 rounded-t"
                style={{
                  height: `${(d.expense / max) * 100}%`,
                  backgroundColor: EXPENSE,
                }}
                title={`Gastos: ${formatMoney(d.expense)}`}
              />
            </div>
            <span className="text-xs text-black/50 dark:text-white/50">
              {d.label}
            </span>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-black/50 dark:text-white/50">
            <tr>
              <th className="py-1 pr-2 font-medium">Mes</th>
              <th className="py-1 pr-2 text-right font-medium">Ingresos</th>
              <th className="py-1 pr-2 text-right font-medium">Gastos</th>
              <th className="py-1 text-right font-medium">Balance</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr
                key={d.label}
                className="border-t border-black/5 dark:border-white/5"
              >
                <td className="py-1 pr-2">{d.label}</td>
                <td className="py-1 pr-2 text-right">{formatMoney(d.income)}</td>
                <td className="py-1 pr-2 text-right">{formatMoney(d.expense)}</td>
                <td
                  className={`py-1 text-right font-medium ${
                    d.income - d.expense >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {formatMoney(d.income - d.expense)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
