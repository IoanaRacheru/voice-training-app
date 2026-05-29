const THREE_MINUTES = 180;
const FIVE_MINUTES = 300;

const SHORT_EXERCISE_IDS = new Set([
  "pronunciation",
  "diction",
  "pitch-control",
  "volume-control",
  "mimic-tones",
  "larynx-raise-tutorial",
  "bubble-phonation",
]);

const LONG_EXERCISE_IDS = new Set([
  "resonance-humming",
  "breathing-control",
  "lung-capacity",
  "resonance",
]);

export const exerciseDurationService = {
  getRecommendedDurationSeconds(exercise) {
    if (SHORT_EXERCISE_IDS.has(exercise?.id)) {
      return THREE_MINUTES;
    }

    if (LONG_EXERCISE_IDS.has(exercise?.id)) {
      return FIVE_MINUTES;
    }

    if (["pronunciation", "diction", "clarity"].includes(exercise?.goalType)) {
      return THREE_MINUTES;
    }

    if (["duration", "steady_sustained_sound", "resonance_consistency"].includes(exercise?.goalType)) {
      return FIVE_MINUTES;
    }

    return THREE_MINUTES;
  },
};
