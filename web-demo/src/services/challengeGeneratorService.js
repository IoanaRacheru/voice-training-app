import { challengeService } from "./challengeService.js";
import { createLocalJsonStore } from "./core/localJsonStore.js";

const HISTORY_KEY = "voiceChallengeGenerationHistory";
const DAY_MS = 24 * 60 * 60 * 1000;
const historyStore = createLocalJsonStore(HISTORY_KEY, () => []);

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
  const parsed = historyStore.read();
  return Array.isArray(parsed) ? parsed : [];
}

function saveGeneration(date, exerciseIds) {
  const nextHistory = [
    ...getStoredHistory().filter((entry) => entry?.date !== date),
    { date, exerciseIds },
  ].slice(-14);
  historyStore.write(nextHistory);
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

  generateDailyChallenge({ user, exerciseCount = 5, selectedExerciseIds = [], date = getToday() }) {
    const selectedCount = Math.max(1, Math.min(12, Number(exerciseCount) || 5));
    const profileSnapshot = getProfileSnapshot(user);
    const history = getStoredHistory();
    const yesterday = history[history.length - 1]?.exerciseIds || [];
    const recentExerciseIds = getRecentExerciseIds(history, date);
    const freshSelectedIds = selectedExerciseIds.filter((id) => !recentExerciseIds.has(id));
    const automaticExerciseIds = challengeService.getRandomExerciseIds(
      selectedCount,
      profileSnapshot.goal,
      Array.from(recentExerciseIds)
    );
    let selected = challengeService.buildChallengeExercises({
      selectedExerciseIds: freshSelectedIds.length ? freshSelectedIds : automaticExerciseIds,
      count: selectedCount,
      date,
      goal: profileSnapshot.goal,
    });

    if (
      selected.map((exercise) => exercise.id).join("|") === yesterday.join("|") &&
      selected.length > 1
    ) {
      selected = [selected[1], selected[0], ...selected.slice(2)];
    }

    saveGeneration(date, selected.map((exercise) => exercise.id));

    return {
      date,
      profileGoalSnapshot: profileSnapshot,
      selectedExerciseCount: selectedCount,
      exercises: selected,
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
