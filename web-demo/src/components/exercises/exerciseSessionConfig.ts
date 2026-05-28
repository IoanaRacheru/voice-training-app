import type { SessionVisualAidType } from "@/features/exercises/toolTypes";
import type { VoiceExercise } from "@/features/exercises/types";

export type ExerciseSessionConfig = {
  shortInstruction: string;
  visualAid: SessionVisualAidType;
  graphType: "none" | "pitch" | "resonance" | "gender";
  showReset: boolean;
};

const defaultConfig: ExerciseSessionConfig = {
  shortInstruction: "Practice comfortably and stop if your throat feels strained.",
  visualAid: "general",
  graphType: "pitch",
  showReset: true,
};

const byExerciseId: Record<string, Partial<ExerciseSessionConfig>> = {
  "breathing-control": {
    shortInstruction: "Inhale quietly through your nose and release a smooth, steady vowel on one breath.",
    visualAid: "breathing",
    graphType: "none",
    showReset: false,
  },
  "hydration-break": {
    shortInstruction: "Drink water, relax jaw and neck, then resume only when your voice feels easy.",
    visualAid: "general",
    graphType: "none",
    showReset: false,
  },
  "resonance-humming": {
    shortInstruction: "Hum softly with lips closed and aim for gentle vibration in lips and face.",
    visualAid: "humming",
    graphType: "resonance",
    showReset: true,
  },
  resonance: {
    shortInstruction: "Use relaxed humming and nasal sounds while keeping vibration forward and easy.",
    visualAid: "resonance",
    graphType: "resonance",
    showReset: true,
  },
  "bubble-phonation": {
    shortInstruction: "Blow gently through the straw and voice softly, keeping bubbles steady and controlled.",
    visualAid: "resonance",
    graphType: "resonance",
    showReset: true,
  },
  "larynx-raise-tutorial": {
    shortInstruction: "Use a light, bright syllable and keep neck muscles relaxed while feeling subtle lift.",
    visualAid: "larynx",
    graphType: "none",
    showReset: false,
  },
  "pitch-control": {
    shortInstruction: "Read one short phrase and keep your pitch movement smooth and controlled.",
    visualAid: "pitch",
    graphType: "pitch",
    showReset: true,
  },
  "mimic-tones": {
    shortInstruction: "Match one target tone at a time and adjust gradually, not abruptly.",
    visualAid: "pitch",
    graphType: "pitch",
    showReset: true,
  },
  "lung-capacity": {
    shortInstruction: "Take a relaxed breath and sustain one comfortable sound without forcing.",
    visualAid: "breathing",
    graphType: "none",
    showReset: false,
  },
};

export function getExerciseSessionConfig(exercise: VoiceExercise): ExerciseSessionConfig {
  return {
    ...defaultConfig,
    ...(byExerciseId[exercise.id] || {}),
  };
}
