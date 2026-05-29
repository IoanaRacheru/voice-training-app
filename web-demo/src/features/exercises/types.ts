
export type ExerciseExperience = {
  focus: string;
  icon: "timer" | "hydration" | "breath" | "resonance" | "larynx";
  steps: string[];
  safetyNotes?: string[];
  extraTip?: string;
};


export type VoiceExercise = {
  id: string;
  name: string;
  explanation: string;
  howTo: string;
  examples: string[];
  readingPassageTitle?: string;
  readingPassageLines?: string[];
  trains: string;
  goal: string;
  goalType: string;
  goalLabel: string;
  experience?: ExerciseExperience;
};
