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
    <div className="relative w-full h-32 flex items-center justify-center gap-[3px] overflow-hidden rounded-2xl bg-muted/30 border border-border/50 px-4">
      <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />

      {bars.map((height, i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-75"
          style={{
            width: "3px",
            height: `${height}px`,
            background: isRecording
              ? "linear-gradient(to top, hsl(262 80% 60%), hsl(180 60% 45%))"
              : "hsl(230 18% 22%)",
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