import React from "react";
/**
 * @param {{
 *   isRecording: boolean,
 *   waveformData?: number[]
 * }} props
 */
export default function WaveformVisualizer({ isRecording, waveformData = [] }) {
  const bars = Array.from({ length: 56 }, (_, index) => {
    const amplitude = waveformData[index] ?? 0;
    const normalizedAmplitude = Math.abs(amplitude);
    return isRecording ? Math.max(7, normalizedAmplitude * 140) : 7;
  });

  return (
    <div className="relative flex h-48 w-full items-center justify-center overflow-hidden bg-background px-4">
      <div className="absolute inset-x-4 top-1/2 h-px bg-foreground/20" />

      <div className="flex h-full w-full items-center justify-between gap-[3px]">
        {bars.map((height, index) => (
          <span
            key={index}
            className="block transition-all duration-75"
            style={{
              width: "4px",
              height: `${height}px`,
              background:
                isRecording && index % 11 === 0
                  ? "#e50914"
                  : isRecording
                    ? "#111111"
                    : "#d6d3ce",
            }}
          />
        ))}
      </div>

      {!isRecording && (
        <div className="absolute inset-0 grid place-items-center bg-background/90">
          <p className="text-sm font-semibold text-muted-foreground">
            Press record to start.
          </p>
        </div>
      )}
    </div>
  );
}
