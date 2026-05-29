import type { SessionVisualAidType } from "@/features/exercises/toolTypes";
import type { VoiceExercise } from "@/features/exercises/types";

export type ExerciseSessionConfig = {
  shortInstruction: string;
  visualAid: SessionVisualAidType;
  graphTypes: Array<"pitch" | "resonance" | "gender">;
  requiresRecorder: boolean;
  showReset: boolean;
};

const defaultConfig: ExerciseSessionConfig = {
  shortInstruction: "Practice comfortably and stop if your throat feels strained.",
  visualAid: "general",
  graphTypes: ["pitch"],
  requiresRecorder: true,
  showReset: true,
};

const byExerciseId: Record<string, Partial<ExerciseSessionConfig>> = {
  "breathing-control": {
    shortInstruction: "Inhale quietly through your nose and release a smooth, steady vowel on one breath.",
    visualAid: "breathing",
    graphTypes: [],
    requiresRecorder: false,
    showReset: false,
  },
  "hydration-break": {
    shortInstruction: "Drink water, relax jaw and neck, then resume only when your voice feels easy.",
    visualAid: "general",
    graphTypes: [],
    requiresRecorder: false,
    showReset: false,
  },
  "resonance-humming": {
    shortInstruction: "This is used to test the user's resonance after Bubble Phonation. Imitate the feeling of bubble phonation, but without using the glass of water and straw.",
    visualAid: "humming",
    graphTypes: ["resonance"],
    requiresRecorder: true,
    showReset: true,
  },
  resonance: {
    shortInstruction: "Use relaxed humming and nasal sounds while keeping vibration forward and easy.",
    visualAid: "resonance",
    graphTypes: ["resonance"],
    showReset: true,
  },
  "bubble-phonation": {
    shortInstruction: "Practice first with a straw in a glass of water. Keep the bubbles steady, then try the same easy vibration without the straw by using Resonance Humming.",
    visualAid: "resonance",
    graphTypes: [],
    requiresRecorder: false,
    showReset: false,
  },
  "larynx-raise-tutorial": {
    shortInstruction: "Use a light, bright syllable and keep neck muscles relaxed while feeling subtle lift.",
    visualAid: "larynx",
    graphTypes: [],
    requiresRecorder: false,
    showReset: false,
  },
  "pitch-control": {
    shortInstruction: "Read one short phrase and keep your pitch movement smooth and controlled.",
    visualAid: "pitch",
    graphTypes: ["pitch", "gender"],
    showReset: true,
  },
  "mimic-tones": {
    shortInstruction: "Match one target tone at a time and adjust gradually, not abruptly.",
    visualAid: "pitch",
    graphTypes: ["pitch"],
    showReset: true,
  },
  "lung-capacity": {
    shortInstruction: "Take a relaxed breath and sustain one comfortable sound without forcing.",
    visualAid: "breathing",
    graphTypes: [],
    requiresRecorder: false,
    showReset: false,
  },
};

export function getExerciseSessionConfig(exercise: VoiceExercise): ExerciseSessionConfig {
  return {
    ...defaultConfig,
    ...(byExerciseId[exercise.id] || {}),
  };
}
