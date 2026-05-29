import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { TimeSeriesPoint, volumeData } from "./mockVoiceAnalyticsData";
import { VoiceChartCard } from "./VoiceChartCard";

type VolumeChartProps = {
  data?: TimeSeriesPoint[];
  title?: string;
};

const chartConfig = {
  value: {
    label: "Volume",
    color: "#68A691",
  },
};

export function VolumeChart({ data = volumeData, title = "Volume" }: VolumeChartProps) {
  const chartData = Array.isArray((data as any)?.volume) ? (data as any).volume : data;
  return (
    <VoiceChartCard
      title={title}
      description="Mock loudness trend using normalized amplitude values."
    >
      <ChartContainer config={chartConfig} className="h-[240px] w-full">
        <LineChart data={chartData} margin={{ left: 4, right: 8, top: 12 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} width={28} domain={[0, 100]} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--color-value)"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ChartContainer>
    </VoiceChartCard>
  );
}
