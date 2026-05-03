import React from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts';

/**
 * @param {{
 *   data: Array<{ time: string | number; pitch: number }>;
 *   targetRange?: number[];
 * }} props
 */
export default function PitchChart({ data, targetRange }) {
  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <defs>
            <linearGradient id="pitchGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />

          <XAxis
            dataKey="time"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={false}
          />

          <YAxis
            domain={[80, 300]}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}Hz`}
          />

          {targetRange && (
            <>
              <ReferenceLine
                y={targetRange[0]}
                stroke="hsl(var(--accent))"
                strokeDasharray="4 4"
                strokeOpacity={0.5}
              />
              <ReferenceLine
                y={targetRange[1]}
                stroke="hsl(var(--accent))"
                strokeDasharray="4 4"
                strokeOpacity={0.5}
              />
            </>
          )}

          <Area
            type="monotone"
            dataKey="pitch"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#pitchGradient)"
            dot={false}
            activeDot={{
              r: 4,
              fill: 'hsl(var(--primary))',
              stroke: 'white',
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
