import {
  FrequencySpectrumChart,
  HarmonicsChart,
  SpectrogramChart,
  VocalWeightChart,
  VolumeChart,
} from "@/components/voice-analytics";
import type { VoiceAnalyticsTool } from "@/features/exercises/toolTypes";

/**
 * Config-driven catalog for Voice Analytics tools.
 */
export const voiceAnalyticsTools: VoiceAnalyticsTool[] = [
  {
    id: "vocal-weight",
    name: "Vocal Weight",
    description: "Track voice weight stability while recording.",
    shortInstruction: "Use a comfortable sustained sound and keep intensity steady while monitoring weight changes.",
    visualAid: "general",
    showReset: true,
    requiresPitchGraph: false,
    requiresResonanceGraph: false,
    requiresGenderGraph: false,
    Component: VocalWeightChart,
  },
  {
    id: "volume",
    name: "Volume Monitor",
    description: "Visualize loudness consistency through the take.",
    shortInstruction: "Read one short phrase repeatedly and keep loudness even from start to finish.",
    visualAid: "breathing",
    showReset: true,
    requiresPitchGraph: false,
    requiresResonanceGraph: false,
    requiresGenderGraph: false,
    Component: VolumeChart,
  },
  {
    id: "harmonics",
    name: "Harmonics",
    description: "Inspect harmonic balance alongside live recording.",
    shortInstruction: "Sustain an easy vowel and compare harmonic shape while keeping a relaxed tone.",
    visualAid: "resonance",
    showReset: true,
    requiresPitchGraph: false,
    requiresResonanceGraph: true,
    requiresGenderGraph: false,
    Component: HarmonicsChart,
  },
  {
    id: "spectrum",
    name: "Frequency Spectrum",
    description: "View distribution of voice energy by frequency bands.",
    shortInstruction: "Speak naturally for a few seconds and observe where most voice energy sits in the spectrum.",
    visualAid: "pitch",
    showReset: true,
    requiresPitchGraph: true,
    requiresResonanceGraph: false,
    requiresGenderGraph: false,
    Component: FrequencySpectrumChart,
  },
  {
    id: "spectrogram",
    name: "Spectrogram",
    description: "See spectral intensity over time in one view.",
    shortInstruction: "Hold a steady sound, then vary tone slightly and watch how the spectrogram pattern shifts.",
    visualAid: "humming",
    showReset: true,
    requiresPitchGraph: true,
    requiresResonanceGraph: true,
    requiresGenderGraph: false,
    Component: SpectrogramChart,
  },
];
