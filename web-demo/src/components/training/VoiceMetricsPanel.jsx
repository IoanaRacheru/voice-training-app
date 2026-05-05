// @ts-nocheck

import React from "react";
import { Info } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const metrics = [
  {
    key: "pitch",
    label: "Pitch",
    value: ({ isRecording, currentPitch }) =>
      isRecording ? `${currentPitch} Hz` : "-- Hz",
    hint: "Fundamental frequency of the sustained tone.",
    accent: "bg-primary",
  },
  {
    key: "f1",
    label: "F1",
    value: () => "-- Hz",
    hint: "First formant; often reflects vowel openness.",
    accent: "bg-cyan-500",
  },
  {
    key: "f2",
    label: "F2",
    value: () => "-- Hz",
    hint: "Second formant; often reflects tongue placement and resonance.",
    accent: "bg-emerald-500",
  },
  {
    key: "f3",
    label: "F3",
    value: () => "-- Hz",
    hint: "Third formant; helps describe higher resonance detail.",
    accent: "bg-amber-500",
  },
  {
    key: "spectralTilt",
    label: "Spectral tilt",
    value: () => "-- dB/oct",
    hint: "Balance between low and high frequency energy in the voice.",
    accent: "bg-rose-500",
  },
];

export default function VoiceMetricsPanel({ isRecording, currentPitch }) {
  return (
    <TooltipProvider delayDuration={150}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <div
            key={metric.key}
            className="min-h-[126px] border border-border bg-background p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className={`h-2.5 w-2.5 shrink-0 ${metric.accent}`} />
                <p className="truncate font-mono text-[11px] uppercase text-muted-foreground">
                  {metric.label}
                </p>
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={`${metric.label} details`}
                    className="grid h-6 w-6 shrink-0 place-items-center text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Info className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-[220px] leading-5">
                  {metric.hint}
                </TooltipContent>
              </Tooltip>
            </div>

            <p className="mt-5 font-display text-3xl uppercase leading-none text-foreground">
              {metric.value({ isRecording, currentPitch })}
            </p>

            <p className="mt-3 text-xs font-semibold uppercase text-muted-foreground">
              {metric.key === "pitch" ? "Live" : "Planned"}
            </p>
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
}
