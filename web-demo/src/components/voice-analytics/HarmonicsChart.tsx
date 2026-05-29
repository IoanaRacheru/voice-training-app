import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import { HarmonicPoint } from "./mockVoiceAnalyticsData";
import { VoiceChartCard } from "./VoiceChartCard";

type HarmonicValue = {
  label: string;
  value: number;
  definition?: string;
};

type VoiceToneLabel = "Darker" | "Brighter" | "Breathier" | "Pressed";

type HarmonicsChartProps = {
  data?: HarmonicPoint[] | { harmonics?: HarmonicValue[] };
  title?: string;
};

const HARMONIC_DEFINITIONS: Record<string, string> = {
  H1: "Fundamental harmonic: base pitch and low voice energy.",
  H2: "Second harmonic: warmth and lower resonance balance.",
  H3: "Middle harmonic: connects low energy with brighter resonance.",
  H4: "Upper harmonic: clarity and brighter voice energy.",
  H5: "Higher harmonic: brightness, edge, or pressed quality when strong.",
};

const chartConfig = {
  value: {
    label: "Level",
    color: "#68A691",
  },
};

function clampPercent(value: unknown) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return 0;
  return Math.max(0, Math.min(100, Math.round(numberValue)));
}

function normalizeHarmonics(data: HarmonicsChartProps["data"]): HarmonicValue[] {
  let values: HarmonicValue[] = [];

  if (Array.isArray((data as any)?.harmonics) && (data as any).harmonics.length) {
    values = (data as any).harmonics;
  } else if (Array.isArray(data) && data.length && "value" in (data[0] as any)) {
    values = data as unknown as HarmonicValue[];
  }

  return Array.from({ length: 5 }, (_, index) => {
    const label = values[index]?.label || `H${index + 1}`;
    return {
      label,
      value: clampPercent(values[index]?.value),
      definition: HARMONIC_DEFINITIONS[label] || "One measured band of harmonic voice energy.",
    };
  });
}

function classifyVoiceTone(harmonics: HarmonicValue[]): VoiceToneLabel {
  const [h1, h2, h3, h4, h5] = harmonics.map((point) => point.value);
  const lowEnergy = (h1 + h2) / 2;
  const highEnergy = (h4 + h5) / 2;
  const average = (h1 + h2 + h3 + h4 + h5) / 5;
  const strongest = Math.max(h1, h2, h3, h4, h5);

  const brightness = highEnergy - lowEnergy + h3 * 0.15;
  const breathiness = 70 - average + Math.max(0, h1 - highEnergy) * 0.15;
  const pressure = average * 0.72 + strongest * 0.28;

  if (pressure >= 62) return "Pressed";
  if (breathiness >= 48) return "Breathier";
  if (brightness >= 6) return "Brighter";
  return "Darker";
}

function HarmonicTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;

  return (
    <div className="max-w-64 rounded-[4px] border border-border bg-card p-3 text-xs shadow-[0_12px_35px_rgba(105,79,93,0.07)]">
      <p className="font-black uppercase text-foreground">{point.label}: {point.value}</p>
      <p className="mt-1 leading-5 text-muted-foreground">{point.definition}</p>
    </div>
  );
}

export function HarmonicsChart({ data, title = "Harmonics" }: HarmonicsChartProps) {
  const harmonics = normalizeHarmonics(data);
  const tone = classifyVoiceTone(harmonics);

  return (
    <VoiceChartCard
      title={title}
      description="Live harmonic levels from H1 to H5."
    >
      <div className="space-y-4">
        <ChartContainer config={chartConfig} className="h-[240px] w-full">
          <BarChart data={harmonics} margin={{ left: 4, right: 8, top: 20, bottom: 4 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} width={30} domain={[0, 100]} />
            <ChartTooltip content={<HarmonicTooltip />} />
            <Bar dataKey="value" name="Level" fill="var(--color-value)" radius={[4, 4, 0, 0]}>
              <LabelList dataKey="value" position="top" className="fill-foreground text-xs font-bold" />
            </Bar>
          </BarChart>
        </ChartContainer>

        <div className="rounded-[6px] bg-background px-4 py-3 text-center">
          <p className="font-mono text-[11px] uppercase text-muted-foreground">Voice type</p>
          <p className="mt-1 text-xl font-black uppercase text-foreground">{tone}</p>
        </div>
      </div>
    </VoiceChartCard>
  );
}
