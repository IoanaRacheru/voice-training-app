// @ts-nocheck

import { challengeExercisePool } from "@/data/challengeExercisePool";

const HISTORY_KEY = "voiceChallengeGenerationHistory";
const DAY_MS = 24 * 60 * 60 * 1000;

function getToday() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getLocalDayTime(dateString) {
  const [year, month, day] = String(dateString).split("-").map(Number);
  return new Date(year, month - 1, day).getTime();
}

function normalizeGoal(goal) {
  const normalized = String(goal || "").toLowerCase();

  if (["feminine", "feminize", "feminization"].includes(normalized)) {
    return "feminization";
  }

  if (["masculine", "masculinize", "masculinization"].includes(normalized)) {
    return "masculinization";
  }

  if (["clear", "clearer", "clarity", "articulation"].includes(normalized)) {
    return "clarity";
  }

  if (["sing", "singing"].includes(normalized)) {
    return "singing";
  }

  if (["confidence", "confident"].includes(normalized)) {
    return "confidence";
  }

  return "general";
}

function getStoredHistory() {
  if (typeof localStorage === "undefined") {
    return [];
  }

  try {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function saveGeneration(date, exerciseIds) {
  if (typeof localStorage === "undefined") {
    return;
  }

  const nextHistory = [
    ...getStoredHistory().filter((entry) => entry?.date !== date),
    { date, exerciseIds },
  ].slice(-14);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
}

function getRecentExerciseIds(history, today = getToday()) {
  const todayTime = getLocalDayTime(today);

  return new Set(
    history
      .filter((entry) => {
        const entryTime = getLocalDayTime(entry.date);
        return Number.isFinite(entryTime) && todayTime - entryTime <= 7 * DAY_MS;
      })
      .flatMap((entry) => entry.exerciseIds || [])
  );
}

function seededRandom(seed) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

function seedFromText(text) {
  return String(text)
    .split("")
    .reduce((seed, char) => seed + char.charCodeAt(0), 17);
}

function shuffle(items, seedText) {
  const random = seededRandom(seedFromText(seedText));
  const nextItems = [...items];

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [nextItems[index], nextItems[swapIndex]] = [nextItems[swapIndex], nextItems[index]];
  }

  return nextItems;
}

function getProfileSnapshot(user) {
  const goal = normalizeGoal(user?.voice_goal || user?.target_voice_goal);
  const dailyPracticeTime = Number(user?.daily_practice_time || user?.dailyPracticeTime || 0);

  return {
    goal,
    rawGoal: user?.voice_goal || user?.target_voice_goal || null,
    difficulty: user?.difficulty || user?.training_difficulty || (user?.easy_mode ? "easy" : "medium"),
    easyMode: Boolean(user?.easy_mode || user?.easyMode),
    dailyPracticeTime: Number.isFinite(dailyPracticeTime) && dailyPracticeTime > 0 ? dailyPracticeTime : null,
    focusArea: user?.focus_area || user?.focusArea || null,
    targetPitchRange: user?.target_pitch_range || null,
    generatedFromProfileAt: new Date().toISOString(),
  };
}

function chooseDuration(exercise, profileSnapshot) {
  const options = exercise.durationOptions || [180, 300, 600];
  const goalPriorityMap = {
    feminization: ["pitch", "resonance", "intonation", "breath", "pronunciation"],
    masculinization: ["pitch", "volume", "breath", "resonance"],
    clarity: ["pronunciation", "diction", "clarity", "volume", "resonance"],
    singing: ["mimic_tones", "lung_capacity", "breath", "pitch"],
    confidence: ["volume", "diction", "clarity", "pronunciation"],
    general: ["pitch", "breath", "diction", "resonance"],
  };
  const priorityCategories =
    goalPriorityMap[profileSnapshot.goal] || goalPriorityMap.general;
  const priorityIndex = priorityCategories.indexOf(exercise.category);
  const isPrimaryForGoal = priorityIndex >= 0 && priorityIndex <= 2;
  const isSecondaryForGoal = priorityIndex > 2;

  if (profileSnapshot.easyMode || profileSnapshot.difficulty === "easy") {
    return isPrimaryForGoal ? 300 : 180;
  }

  if (profileSnapshot.difficulty === "hard") {
    return isPrimaryForGoal ? 600 : 300;
  }

  if (isPrimaryForGoal) {
    return 600;
  }

  if (isSecondaryForGoal) {
    return 300;
  }

  return 180;
}

function getGoalFeedback(goal) {
  if (goal === "feminization") {
    return "Nice work. Keep blending pitch control, resonance, and relaxed articulation.";
  }

  if (goal === "masculinization") {
    return "Nice work. Keep the tone grounded, relaxed, and consistent.";
  }

  if (goal === "clarity") {
    return "Nice work. Your clarity routine is strongest when every word keeps its shape.";
  }

  if (goal === "singing") {
    return "Nice work. Your breath, pitch matching, and sustained sound are building together.";
  }

  return "Nice work. This balanced routine keeps your voice control moving forward.";
}

export const challengeGeneratorService = {
  getToday,
  getProfileSnapshot,
  normalizeGoal,
  getGoalFeedback,

  generateDailyChallenge({ user, exerciseCount = 5, date = getToday() }) {
    const selectedCount = Math.max(1, Math.min(12, Number(exerciseCount) || 5));
    const profileSnapshot = getProfileSnapshot(user);
    const history = getStoredHistory();
    const recentExerciseIds = getRecentExerciseIds(history, date);
    const yesterday = history[history.length - 1]?.exerciseIds || [];

    const supported = challengeExercisePool.filter((exercise) =>
      exercise.supportedGoals.includes(profileSnapshot.goal)
    );
    const fallback = challengeExercisePool.filter((exercise) =>
      exercise.supportedGoals.includes("general")
    );
    const source = supported.length ? supported : fallback;
    const uniqueFirst = shuffle(
      source.filter((exercise) => !recentExerciseIds.has(exercise.id)),
      `${date}-${profileSnapshot.goal}-fresh`
    );
    const repeats = shuffle(source, `${date}-${profileSnapshot.goal}-repeat`);
    let selected = [...uniqueFirst, ...repeats].slice(0, selectedCount);

    if (
      selected.map((exercise) => exercise.id).join("|") === yesterday.join("|") &&
      repeats.length > 1
    ) {
      selected = [selected[1], selected[0], ...selected.slice(2)];
    }

    const exercises = selected.map((exercise, index) => ({
      ...exercise,
      challengeId: `${date}-${exercise.id}-${index}`,
      durationSeconds: chooseDuration(exercise, profileSnapshot),
      status: index === 0 ? "available" : "locked",
      progress: 0,
      order: index,
      motivationalFeedback:
        index === 0
          ? "Start calm and let the first take set the tone."
          : "Complete the previous step to unlock this one.",
    }));

    saveGeneration(date, exercises.map((exercise) => exercise.id));

    return {
      date,
      profileGoalSnapshot: profileSnapshot,
      selectedExerciseCount: selectedCount,
      exercises,
      orderLocked: false,
      startedAt: null,
      completedAt: null,
      status: "not_started",
      currentExerciseIndex: 0,
      results: [],
      completionFeedback: getGoalFeedback(profileSnapshot.goal),
    };
  },
};
