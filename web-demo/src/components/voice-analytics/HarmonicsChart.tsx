import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { HarmonicPoint, harmonicsData } from "./mockVoiceAnalyticsData";
import { VoiceChartCard } from "./VoiceChartCard";

type HarmonicsChartProps = {
  data?: HarmonicPoint[];
  title?: string;
};

const chartConfig = {
  fundamental: {
    label: "Fundamental",
    color: "#0891b2",
  },
  overtone: {
    label: "Overtone",
    color: "#f59e0b",
  },
};

export function HarmonicsChart({
  data = harmonicsData,
  title = "Harmonics",
}: HarmonicsChartProps) {
  return (
    <VoiceChartCard
      title={title}
      description="Relative energy across fundamental and overtone bands."
    >
      <ChartContainer config={chartConfig} className="h-[240px] w-full">
        <BarChart data={data} margin={{ left: 4, right: 8, top: 12 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} width={28} domain={[0, 100]} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend content={<ChartLegendContent />} />
          <Bar dataKey="fundamental" fill="var(--color-fundamental)" radius={[3, 3, 0, 0]} />
          <Bar dataKey="overtone" fill="var(--color-overtone)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </VoiceChartCard>
  );
}

