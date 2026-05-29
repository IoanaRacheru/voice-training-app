import { createLocalJsonStore } from "./core/localJsonStore.js";
import { emitAppEvent } from "./core/appEventBus.js";

const STORAGE_KEY = "voiceExerciseSessions";
const store = createLocalJsonStore(STORAGE_KEY, () => []);

export const exerciseSessionRepository = {
  getAll() {
    const parsed = store.read();
    return Array.isArray(parsed) ? parsed : [];
  },

  save(session) {
    const nextSessions = [...this.getAll(), session];
    store.write(nextSessions);
    emitAppEvent("voiceExerciseSessions:changed", {
      sessions: nextSessions,
      count: nextSessions.length,
    });
    return session;
  },
};

