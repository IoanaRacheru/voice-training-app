import type { ComponentType } from "react";

export type SessionVisualAidType =
  | "breathing"
  | "resonance"
  | "pitch"
  | "humming"
  | "larynx"
  | "general";

/**
 * Declarative voice analytics tool descriptor used for card lists and sessions.
 */
export type VoiceAnalyticsTool = {
  id: string;
  name: string;
  description: string;
  shortInstruction: string;
  visualAid: SessionVisualAidType;
  showReset: boolean;
  requiresPitchGraph: boolean;
  requiresResonanceGraph: boolean;
  requiresGenderGraph: boolean;
  Component: ComponentType;
};
