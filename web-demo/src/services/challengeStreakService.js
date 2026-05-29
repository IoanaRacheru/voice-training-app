import { emitAppEvent } from "./core/appEventBus.js";
import { createLocalJsonStore } from "./core/localJsonStore.js";

const STORAGE_KEY = "voiceChallengeStreak";
const streakStore = createLocalJsonStore(STORAGE_KEY, () => null);

function getToday() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(dateString, days) {
  const [year, month, day] = String(dateString).split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, "0");
  const nextDay = String(date.getDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

const defaultState = {
  currentChallengeStreak: 0,
  longestChallengeStreak: 0,
  lastChallengeCompletedDate: null,
  completedChallengeDates: [],
};

function readState() {
  const parsed = streakStore.read();
  return {
    ...defaultState,
    ...(parsed && typeof parsed === "object" ? parsed : {}),
    completedChallengeDates: Array.isArray(parsed?.completedChallengeDates)
      ? parsed.completedChallengeDates
      : [],
  };
}

function writeState(state) {
  streakStore.write(state);
  emitAppEvent("voiceChallengeStreak:changed", state);
}

function normalizeForToday(state, today = getToday()) {
  if (
    !state.lastChallengeCompletedDate ||
    state.lastChallengeCompletedDate === today ||
    state.lastChallengeCompletedDate === addDays(today, -1)
  ) {
    return state;
  }

  return {
    ...state,
    currentChallengeStreak: 0,
  };
}

export const challengeStreakService = {
  getToday,

  getState() {
    const state = readState();
    const normalizedState = normalizeForToday(state);

    if (normalizedState.currentChallengeStreak !== state.currentChallengeStreak) {
      writeState(normalizedState);
    }

    return normalizedState;
  },

  completeChallenge(date = getToday()) {
    const state = normalizeForToday(readState(), date);

    if (state.completedChallengeDates.includes(date)) {
      return state;
    }

    const yesterday = addDays(date, -1);
    const currentChallengeStreak =
      state.lastChallengeCompletedDate === yesterday
        ? state.currentChallengeStreak + 1
        : 1;
    const nextState = {
      currentChallengeStreak,
      longestChallengeStreak: Math.max(
        state.longestChallengeStreak,
        currentChallengeStreak
      ),
      lastChallengeCompletedDate: date,
      completedChallengeDates: [...state.completedChallengeDates, date].slice(-365),
    };

    writeState(nextState);
    return nextState;
  },
};
