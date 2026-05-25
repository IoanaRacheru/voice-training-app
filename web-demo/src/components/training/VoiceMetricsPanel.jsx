// @ts-nocheck

import React from "react";
import { Info } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { analysisService } from "@/services/analysisService";

const metrics = [
  {
    key: "pitch",
    label: "Pitch",
    value: ({ isRecording, currentPitch }) =>
      isRecording && analysisService.isValidPitch(currentPitch)
        ? `${currentPitch} Hz`
        : "-- Hz",
    subValue: ({ isRecording, currentPitch }) => {
      if (!isRecording || !analysisService.isValidPitch(currentPitch)) {
        return "Speak to detect";
      }

      if (currentPitch >= 180) {
        return "Higher pitch zone";
      }

      if (currentPitch >= 145) {
        return "Middle pitch zone";
      }

      return "Lower pitch zone";
    },
    hint: "Pitch is the main frequency of your voice. Use it to see whether your voice is below, inside, or above your profile target range.",
    accent: "bg-primary",
  },
  {
    key: "volume",
    label: "Volume",
    value: ({ isRecording, currentVolume }) =>
      isRecording ? `${currentVolume || 0}/100` : "--",
    subValue: ({ isRecording, currentVolume }) => {
      if (!isRecording) {
        return "Waiting";
      }

      if ((currentVolume || 0) >= 45) {
        return "Strong signal";
      }

      if ((currentVolume || 0) >= 18) {
        return "Clear signal";
      }

      return "Very soft";
    },
    hint: "Volume shows microphone intensity, not voice quality. If it stays very low, move closer or speak a little louder so analysis works better.",
    accent: "bg-cyan-500",
  },
  {
    key: "resonance",
    label: "Resonance",
    value: ({ isRecording, resonanceCentroid }) =>
      isRecording && Number.isFinite(resonanceCentroid)
        ? `${resonanceCentroid} Hz`
        : "-- Hz",
    subValue: ({ isRecording, resonanceCentroid }) => {
      if (!isRecording || !Number.isFinite(resonanceCentroid)) {
        return "Speak to estimate";
      }

      if (resonanceCentroid >= 1900) {
        return "Brighter sound";
      }

      if (resonanceCentroid >= 1300) {
        return "Balanced sound";
      }

      return "Darker sound";
    },
    hint: "Resonance is estimated from spectral brightness. Higher values usually mean a brighter, more forward sound; lower values usually mean a darker sound.",
    accent: "bg-emerald-500",
  },
  {
    key: "presentation",
    label: "Voice",
    value: ({ isRecording, voicePresentation }) =>
      isRecording ? voicePresentation?.label || "--" : "--",
    subValue: ({ isRecording, voicePresentation }) =>
      isRecording
        ? voicePresentation?.detail || "Pitch and resonance estimate"
        : "Feature estimate",
    hint: "This is not an identity label. It estimates whether the current sound is more feminine-coded, masculine-coded, or mixed based on pitch and resonance brightness.",
    accent: "bg-amber-500",
  },
  {
    key: "confidence",
    label: "Confidence",
    value: ({ isRecording, voicePresentation }) =>
      isRecording ? voicePresentation?.confidence || "--" : "--",
    subValue: ({ isRecording }) => (isRecording ? "Estimate quality" : "Waiting"),
    hint: "Confidence tells you how reliable the voice estimate is. It improves when the app has both stable pitch and resonance information.",
    accent: "bg-rose-500",
  },
];

export default function VoiceMetricsPanel({
  isRecording,
  currentPitch,
  currentVolume,
  resonanceCentroid,
  voicePresentation,
}) {
  const liveMetrics = metrics.filter((metric) =>
    ["pitch", "volume", "resonance"].includes(metric.key)
  );
  const estimateMetrics = metrics.filter((metric) =>
    ["presentation", "confidence"].includes(metric.key)
  );
  const renderMetric = (metric) => (
    <div
      key={metric.key}
      className="flex min-h-[168px] min-w-0 flex-col border border-border bg-background p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`h-2.5 w-2.5 shrink-0 ${metric.accent}`} />
          <p className="truncate font-mono text-[11px] uppercase text-muted-foreground">
            {metric.label}
          </p>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={`${metric.label} details`}
              className="grid h-6 w-6 shrink-0 place-items-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Info className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 rounded-[2px] px-3 py-2 text-xs font-semibold leading-5">
            {metric.hint}
          </PopoverContent>
        </Popover>
      </div>

      <p className="mt-4 min-h-[48px] whitespace-normal break-words text-[22px] font-black uppercase leading-6 text-foreground">
        {metric.value({
          isRecording,
          currentPitch,
          currentVolume,
          resonanceCentroid,
          voicePresentation,
        })}
      </p>

      <p className="mt-2 min-h-[42px] text-xs font-semibold leading-5 text-muted-foreground">
        {metric.subValue({
          isRecording,
          currentPitch,
          currentVolume,
          resonanceCentroid,
          voicePresentation,
        })}
      </p>

      <p className="mt-auto pt-2 text-[10px] font-bold uppercase text-muted-foreground">
        {metric.key === "pitch" ||
        metric.key === "volume" ||
        metric.key === "resonance"
          ? "Live"
          : "Estimate"}
      </p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {liveMetrics.map(renderMetric)}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {estimateMetrics.map(renderMetric)}
      </div>
    </div>
  );
}
