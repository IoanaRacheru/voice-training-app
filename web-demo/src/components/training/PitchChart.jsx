import React from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function PitchChart({ data, targetRange }) {
  const hasTargetRange =
    Array.isArray(targetRange) &&
    targetRange.length === 2 &&
    Number.isFinite(Number(targetRange[0])) &&
    Number.isFinite(Number(targetRange[1])) &&
    Number(targetRange[1]) > Number(targetRange[0]);
  const lowTarget = hasTargetRange ? Number(targetRange[0]) : null;
  const highTarget = hasTargetRange ? Number(targetRange[1]) : null;

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
          <Tooltip
            formatter={(value) => [`${Number(value).toFixed(0)} Hz`, "Pitch"]}
            labelFormatter={(label) => `Sample ${label}`}
          />

          {hasTargetRange && (
            <>
              <ReferenceArea
                y1={lowTarget}
                y2={highTarget}
                fill="#68A691"
                fillOpacity={0.16}
                strokeOpacity={0}
              />
              <ReferenceLine
                y={lowTarget}
                stroke="#68A691"
                strokeDasharray="6 4"
                strokeWidth={2}
              />
              <ReferenceLine
                y={highTarget}
                stroke="#68A691"
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
