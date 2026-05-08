import { Fragment } from "react";

import { SpectrogramCell, spectrogramData } from "./mockVoiceAnalyticsData";
import { VoiceChartCard } from "./VoiceChartCard";

type SpectrogramChartProps = {
  data?: SpectrogramCell[];
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
  data = spectrogramData,
  title = "Spectrogram",
}: SpectrogramChartProps) {
  const times = getUniqueValues(data, "time");
  const frequencies = getUniqueValues(data, "frequency");
  const cellsByCoordinate = new Map(
    data.map((cell) => [`${cell.frequency}-${cell.time}`, cell])
  );

  return (
    <VoiceChartCard
      title={title}
      description="Time-frequency intensity map for a sample voice recording."
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
      </div>
    </VoiceChartCard>
  );
}
