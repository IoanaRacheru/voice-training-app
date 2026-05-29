import type { ComponentType } from "react";

export type SessionVisualAidType =
  | "breathing"
  | "resonance"
  | "pitch"
  | "humming"
  | "larynx"
  | "general";


export type VoiceAnalyticsTool = {
  id: string;
  name: string;
  description: string;
  shortInstruction: string;
  readingPassageTitle?: string;
  readingPassageLines?: string[];
  visualAid: SessionVisualAidType;
  showReset: boolean;
  requiresPitchGraph: boolean;
  requiresResonanceGraph: boolean;
  requiresGenderGraph: boolean;
  Component: ComponentType<any>;
};
