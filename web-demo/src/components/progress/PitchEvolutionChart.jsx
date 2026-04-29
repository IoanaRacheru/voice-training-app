// @ts-nocheck

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl bg-card border border-border/50 px-3 py-2 shadow-xl">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-bold text-primary">
        {payload[0].value}Hz avg
      </p>
    </div>
  );
};

export default function PitchEvolutionChart({ data }) {
  return (
    <div className="rounded-2xl bg-card border border-border/50 p-5">
      <h3 className="text-sm font-semibold text-foreground mb-1">
        Pitch Evolution
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        Average pitch per session over time
      </p>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="evoGrad" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="hsl(262 80% 60%)"
                  stopOpacity={0.25}
                />
                <stop
                  offset="100%"
                  stopColor="hsl(262 80% 60%)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(230 18% 15%)"
              vertical={false}
            />

            <XAxis
              dataKey="date"
              tick={{ fill: "hsl(220 10% 45%)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              tick={{ fill: "hsl(220 10% 45%)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}Hz`}
            />

            <Tooltip content={<CustomTooltip />} />

            <Area
              type="monotone"
              dataKey="pitch"
              stroke="hsl(262 80% 60%)"
              strokeWidth={2}
              fill="url(#evoGrad)"
              dot={{
                fill: "hsl(262 80% 60%)",
                r: 3,
                strokeWidth: 0,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}