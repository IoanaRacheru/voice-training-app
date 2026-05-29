import { exercises } from "@/data/exercises";
import { exerciseDurationService } from "./exerciseDurationService.js";

const GOAL_MAP = {
  pitch_stability: "pitch",
  pitch_matching: "pitch",
  resonance_consistency: "resonance",
  steady_sustained_sound: "breath",
  duration: "lung_capacity",
  volume_consistency: "volume",
  clarity: "pronunciation",
  clarity_and_speed: "diction",
  larynx_control: "larynx",
};

function getCategory(exercise) {
  return GOAL_MAP[exercise.goalType] || exercise.id.replace(/-/g, "_");
}

function supportsGoal(exercise, goal) {
  if (goal === "clarity") {
    return ["pronunciation", "diction", "clarity", "volume"].some((value) =>
      getCategory(exercise).includes(value)
    );
  }

  if (goal === "singing") {
    return ["pitch", "breath", "lung_capacity", "mimic"].some((value) =>
      getCategory(exercise).includes(value)
    );
  }

  if (goal === "feminization") {
    return ["pitch", "resonance", "pronunciation", "larynx"].some((value) =>
      getCategory(exercise).includes(value)
    );
  }

  if (goal === "masculinization") {
    return ["pitch", "volume", "breath", "lung_capacity"].some((value) =>
      getCategory(exercise).includes(value)
    );
  }

  return true;
}

function toChallengeExercise(exercise, index, date) {
  const category = getCategory(exercise);

  return {
    id: exercise.id,
    title: exercise.name,
    category,
    supportedGoals: ["general"],
    difficulty: exercise.experience ? "easy" : "medium",
    instructions: exercise.howTo || exercise.explanation,
    examplePrompts: Array.isArray(exercise.examples) && exercise.examples.length ? exercise.examples : [exercise.name],
    successCriteria: exercise.goal || exercise.goalLabel,
    requiresPitch: ["pitch", "resonance", "breath", "lung_capacity", "mimic", "larynx"].some((value) =>
      category.includes(value)
    ),
    requiresVolume: ["pronunciation", "diction", "clarity", "volume"].some((value) =>
      category.includes(value)
    ),
    requiresRecording: true,
    challengeId: `${date}-${exercise.id}-${index}`,
    durationSeconds: exerciseDurationService.getRecommendedDurationSeconds(exercise),
    status: index === 0 ? "available" : "locked",
    progress: 0,
    order: index,
    motivationalFeedback:
      index === 0
        ? "Start calm and let the first take set the tone."
        : "Complete the previous step to unlock this one.",
  };
}

function shuffle(items) {
  const nextItems = [...items];

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [nextItems[index], nextItems[swapIndex]] = [nextItems[swapIndex], nextItems[index]];
  }

  return nextItems;
}

export const challengeService = {
  getAvailableExercises() {
    return exercises;
  },

  getDefaultExerciseIds(count, goal = "general") {
    return exercises
      .filter((exercise) => supportsGoal(exercise, goal))
      .slice(0, count)
      .map((exercise) => exercise.id);
  },

  resolveSelectedExercises(selectedExerciseIds, count, goal = "general") {
    const available = this.getAvailableExercises();
    const availableIds = new Set(available.map((exercise) => exercise.id));
    const selected = (selectedExerciseIds || []).filter((id) => availableIds.has(id));
    const fallback = this.getDefaultExerciseIds(count, goal);
    const merged = [...selected, ...fallback.filter((id) => !selected.includes(id))];
    return merged.slice(0, count);
  },

  getRandomExerciseIds(count, goal = "general", excludedExerciseIds = []) {
    const excluded = new Set(excludedExerciseIds);
    const supported = exercises.filter((exercise) => supportsGoal(exercise, goal));
    const source = supported.length ? supported : exercises;
    const fresh = source.filter((exercise) => !excluded.has(exercise.id));
    const randomSource = fresh.length >= count ? fresh : source;

    return shuffle(randomSource)
      .slice(0, count)
      .map((exercise) => exercise.id);
  },

  buildChallengeExercises({ selectedExerciseIds, count, date, goal }) {
    const selectedIds = selectedExerciseIds?.length
      ? this.resolveSelectedExercises(selectedExerciseIds, count, goal)
      : this.getRandomExerciseIds(count, goal);
    const exercisesById = new Map(exercises.map((exercise) => [exercise.id, exercise]));

    return selectedIds
      .map((id) => exercisesById.get(id))
      .filter(Boolean)
      .map((exercise, index) => toChallengeExercise(exercise, index, date));
  },
};
