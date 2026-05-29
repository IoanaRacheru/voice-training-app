import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { FrequencyBand } from "./mockVoiceAnalyticsData";
import { VoiceChartCard } from "./VoiceChartCard";

type FrequencySpectrumChartProps = {
  data?: FrequencyBand[];
  title?: string;
};

const chartConfig = {
  amplitude: {
    label: "Relative amplitude (%)",
    color: "#68A691",
  },
};

export function FrequencySpectrumChart({
  data = [],
  title = "Frequency Spectrum",
}: FrequencySpectrumChartProps) {
  const chartData = Array.isArray((data as any)?.spectrum) ? (data as any).spectrum : data;
  if (!chartData?.length) {
    return <VoiceChartCard title={title} description="Snapshot of relative amplitude (%) across frequency bands (Hz).">No live data yet.</VoiceChartCard>;
  }
  return (
    <VoiceChartCard
      title={title}
      description="Snapshot of relative amplitude (%) across frequency bands (Hz)."
    >
      <ChartContainer config={chartConfig} className="h-[240px] w-full">
        <BarChart data={chartData} margin={{ left: 4, right: 8, top: 12 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="frequency" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} width={28} domain={[0, 100]} />
          <ChartTooltip content={<ChartTooltipContent formatter={(value) => `${Number(value).toFixed(0)}%`} />} />
          <Bar dataKey="amplitude" fill="var(--color-amplitude)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </VoiceChartCard>
  );
}
