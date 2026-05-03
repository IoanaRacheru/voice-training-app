import React from "react";

/**
 * @param {{
 *   isRecording: boolean;
 *   waveformData?: number[];
 * }} props
 */
export default function WaveformVisualizer({ isRecording, waveformData = [] }) {
  const bars = Array.from({ length: 48 }, (_, i) => {
    const amplitude = waveformData[i] ?? 0;
    const normalizedAmplitude = Math.abs(amplitude);
    const height = isRecording ? Math.max(4, normalizedAmplitude * 120) : 4;

    return height;
  });

  return (
    <div className="relative w-full h-32 flex items-center justify-center gap-[3px] overflow-hidden rounded-[24px] bg-secondary border border-border/70 px-4 shadow-inner">
      <div className="absolute inset-x-6 top-1/2 h-px bg-border/50 z-10 pointer-events-none" />

      {bars.map((height, i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-75"
          style={{
            width: "3px",
            height: `${height}px`,
            background: isRecording
              ? "hsl(var(--chart-5))"
              : "hsl(var(--border))",
          }}
        />
      ))}

      {!isRecording && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <p className="text-sm text-muted-foreground font-medium">
            Press record to start
          </p>
        </div>
      )}
    </div>
  );
}
