import React from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
/**
 * @param {{
 *   data: Array<{ time: string | number, pitch: number }>,
 *   targetRange?: [number, number]
 * }} props
 */
export default function PitchChart({ data, targetRange }) {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 5 }}>
          <CartesianGrid strokeDasharray="2 6" stroke="hsl(var(--border))" vertical={false} />

          <XAxis
            dataKey="time"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 700 }}
            axisLine={{ stroke: "hsl(var(--foreground))" }}
            tickLine={false}
          />

          <YAxis
            domain={[80, 300]}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `${value}Hz`}
          />

          {targetRange && (
            <>
              <ReferenceLine
                y={targetRange[0]}
                stroke="hsl(var(--primary))"
                strokeDasharray="6 4"
                strokeWidth={2}
              />
              <ReferenceLine
                y={targetRange[1]}
                stroke="hsl(var(--primary))"
                strokeDasharray="6 4"
                strokeWidth={2}
              />
            </>
          )}

          <Line
            type="monotone"
            dataKey="pitch"
            stroke="hsl(var(--foreground))"
            strokeWidth={3}
            dot={false}
            activeDot={{
              r: 4,
              fill: "hsl(var(--primary))",
              stroke: "hsl(var(--foreground))",
              strokeWidth: 2,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
