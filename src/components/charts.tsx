"use client";

interface ChartDataItem {
  date: string;
  value?: number;
  count?: number;
  displayValue?: string;
}

interface BarChartProps {
  data: ChartDataItem[];
  title: string;
  valueKey: "value" | "count";
}

export function SimpleBarChart({ data, title, valueKey }: BarChartProps) {
  const max = Math.max(...data.map((d) => d[valueKey] || 0), 1);

  return (
    <div>
      <h3 className="mb-3 text-sm font-medium text-neutral-700">{title}</h3>
      <div className="flex items-end gap-1 h-24">
        {data.map((d, i) => {
          const v = d[valueKey] || 0;
          const h = (v / max) * 100;
          const display = d.displayValue ?? v;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
              <div
                className="w-full bg-accent/70 rounded-t transition-all hover:bg-accent"
                style={{ height: `${Math.max(h, 2)}%` }}
              />
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-neutral-800 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                {display}
              </div>
            </div>
          );
        })}
      </div>
      {data.length > 0 && (
        <div className="flex justify-between mt-1 text-[10px] text-neutral-400">
          <span>{data[0]?.date?.slice(5)}</span>
          <span>{data[data.length - 1]?.date?.slice(5)}</span>
        </div>
      )}
      {data.length === 0 && (
        <p className="py-4 text-center text-xs text-neutral-400">No data for this period</p>
      )}
    </div>
  );
}
