import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { TimeSeriesPoint, vocalWeightData } from "./mockVoiceAnalyticsData";
import { VoiceChartCard } from "./VoiceChartCard";

type VocalWeightChartProps = {
  data?: TimeSeriesPoint[];
  title?: string;
};

const chartConfig = {
  value: {
    label: "Weight",
    color: "#68A691",
  },
};

export function VocalWeightChart({
  data = vocalWeightData,
  title = "Vocal Weight",
}: VocalWeightChartProps) {
  const chartData = Array.isArray((data as any)?.vocalWeight) ? (data as any).vocalWeight : data;
  return (
    <VoiceChartCard
      title={title}
      description="Estimated vocal intensity balance over the recording window."
    >
      <ChartContainer config={chartConfig} className="h-[240px] w-full">
        <AreaChart data={chartData} margin={{ left: 4, right: 8, top: 12 }}>
          <defs>
            <linearGradient id="vocalWeightFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.28} />
              <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} width={28} domain={[0, 100]} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--color-value)"
            fill="url(#vocalWeightFill)"
            strokeWidth={2}
          />
        </AreaChart>
      </ChartContainer>
    </VoiceChartCard>
  );
}
