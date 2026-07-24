"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";

function Sparkline({
  data,
  color = "var(--primary)",
  height = 32,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  const points = data.map((value, index) => ({ index, value }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={points} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`sparkline-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#sparkline-${color})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export { Sparkline };
