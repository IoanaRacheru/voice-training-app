/**
 * Reusable structure for guided exercise metadata.
 */
export type ExerciseExperience = {
  focus: string;
  icon: "timer" | "hydration" | "breath" | "resonance" | "larynx";
  steps: string[];
  safetyNotes?: string[];
  extraTip?: string;
};

/**
 * Core exercise contract used across list, details, and sessions.
 */
export type VoiceExercise = {
  id: string;
  name: string;
  explanation: string;
  howTo: string;
  examples: string[];
  trains: string;
  goal: string;
  goalType: string;
  goalLabel: string;
  experience?: ExerciseExperience;
};

