"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

function DonutChart({ data, size = 120 }: { data: DonutSlice[]; size?: number }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex items-center gap-4">
      <div style={{ width: size, height: size }} className="relative shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius="70%"
              outerRadius="100%"
              paddingAngle={2}
              stroke="var(--card)"
              strokeWidth={2}
            >
              {data.map((slice) => (
                <Cell key={slice.label} fill={slice.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-semibold text-foreground">{total}</span>
          <span className="text-[10px] text-muted-foreground">total</span>
        </div>
      </div>
      <ul className="flex flex-col gap-1.5 text-xs">
        {data.map((slice) => (
          <li key={slice.label} className="flex items-center gap-2">
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
            <span className="text-muted-foreground">{slice.label}</span>
            <span className="font-medium text-foreground">{slice.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export { DonutChart };
export type { DonutSlice };
