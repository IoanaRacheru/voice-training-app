import { createLocalJsonStore } from "./core/localJsonStore.js";
import { emitAppEvent } from "./core/appEventBus.js";

const STORAGE_KEY = "voicePracticeSession";
const ACTIVE_WINDOW_MS = 45 * 60 * 1000;
const REMINDER_COUNTS = new Set([2, 3]);
const store = createLocalJsonStore(STORAGE_KEY, () => ({
  completions: [],
  dismissedCounts: [],
}));

function isSameLocalDay(a, b) {
  const first = new Date(a);
  const second = new Date(b);
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function normalizeState(state = store.read(), now = new Date()) {
  const completions = Array.isArray(state?.completions) ? state.completions : [];
  const active = completions
    .map((entry) => ({ ...entry, timestamp: entry?.timestamp || entry?.completedAt }))
    .filter((entry) => {
      const time = new Date(entry.timestamp).getTime();
      return (
        Number.isFinite(time) &&
        isSameLocalDay(entry.timestamp, now) &&
        now.getTime() - time <= ACTIVE_WINDOW_MS
      );
    });

  const dismissedCounts = Array.isArray(state?.dismissedCounts) ? state.dismissedCounts : [];

  return {
    completions: active,
    dismissedCounts,
  };
}

function getReminderState(state = normalizeState()) {
  const count = state.completions.length;
  const shouldShow = REMINDER_COUNTS.has(count) && !state.dismissedCounts.includes(count);

  return {
    count,
    shouldShow,
    message: "Great work! Take a small break, drink some water, and let your voice rest before continuing.",
  };
}

export const practiceSessionService = {
  getState() {
    const state = normalizeState();
    store.write(state);
    return {
      ...state,
      reminder: getReminderState(state),
    };
  },

  recordCompletion(source, exerciseId) {
    const now = new Date();
    const state = normalizeState(store.read(), now);
    const nextState = {
      ...state,
      completions: [
        ...state.completions,
        {
          source,
          exerciseId,
          timestamp: now.toISOString(),
        },
      ],
    };
    store.write(nextState);
    emitAppEvent("voicePracticeSession:changed", {
      ...nextState,
      reminder: getReminderState(nextState),
    });
    return nextState;
  },

  dismissReminder() {
    const state = normalizeState();
    const count = state.completions.length;
    const nextState = {
      ...state,
      dismissedCounts: Array.from(new Set([...state.dismissedCounts, count])),
    };
    store.write(nextState);
    emitAppEvent("voicePracticeSession:changed", {
      ...nextState,
      reminder: getReminderState(nextState),
    });
    return nextState;
  },
};
