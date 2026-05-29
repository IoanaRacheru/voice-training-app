import { Fragment } from "react";

import { SpectrogramCell } from "./mockVoiceAnalyticsData";
import { VoiceChartCard } from "./VoiceChartCard";

type SpectrogramChartProps = {
  data?: SpectrogramCell[] | { spectrogram?: SpectrogramCell[] };
  title?: string;
};

function getUniqueValues(data: SpectrogramCell[], key: "time" | "frequency") {
  return Array.from(new Set(data.map((cell) => cell[key])));
}

function getHeatColor(intensity: number) {
  const clamped = Math.max(0, Math.min(100, intensity));
  const hue = 220 - clamped * 1.5;
  const lightness = 94 - clamped * 0.42;

  return `hsl(${hue} 80% ${lightness}%)`;
}

export function SpectrogramChart({
  data = [],
  title = "Spectrogram",
}: SpectrogramChartProps) {
  const chartData: SpectrogramCell[] =
    Array.isArray((data as any)?.spectrogram) && (data as any).spectrogram.length
      ? (data as any).spectrogram
      : Array.isArray(data)
        ? data
        : [];
  if (!chartData.length) {
    return <VoiceChartCard title={title} description="Time-frequency map: rows are frequency bands (Hz), columns are time slices, color is relative intensity (%).">No live data yet.</VoiceChartCard>;
  }
  const times = getUniqueValues(chartData, "time").slice(-8);
  const frequencies = getUniqueValues(chartData, "frequency");
  const cellsByCoordinate = new Map(
    chartData.map((cell: SpectrogramCell) => [`${cell.frequency}-${cell.time}`, cell])
  );

  return (
    <VoiceChartCard
      title={title}
      description="Time-frequency map: rows are frequency bands (Hz), columns are time slices, color is relative intensity (%)."
    >
      <div className="grid gap-3">
        <div
          className="grid min-h-[220px] gap-1"
          style={{
            gridTemplateColumns: `48px repeat(${times.length}, minmax(0, 1fr))`,
          }}
        >
          {frequencies.map((frequency) => (
            <Fragment key={frequency}>
              <div
                key={`${frequency}-label`}
                className="flex items-center justify-end pr-2 text-[11px] font-medium text-muted-foreground"
              >
                {frequency}
              </div>
              {times.map((time) => {
                const cell = cellsByCoordinate.get(`${frequency}-${time}`);

                return (
                  <div
                    key={`${frequency}-${time}`}
                    className="min-h-7 rounded-[2px] border border-background"
                    style={{
                      backgroundColor: getHeatColor(cell?.intensity ?? 0),
                    }}
                    title={`${frequency} at ${time}: ${cell?.intensity ?? 0}%`}
                    aria-label={`${frequency} at ${time}: ${cell?.intensity ?? 0}% intensity`}
                  />
                );
              })}
            </Fragment>
          ))}
        </div>
        <div
          className="grid pl-12 text-[11px] font-medium text-muted-foreground"
          style={{
            gridTemplateColumns: `repeat(${times.length}, minmax(0, 1fr))`,
          }}
        >
          {times.map((time) => (
            <span key={time} className="text-center">
              {time}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between text-[11px] font-semibold uppercase text-muted-foreground">
          <span>Frequency (Hz)</span>
          <span>Time</span>
        </div>
      </div>
    </VoiceChartCard>
  );
}
