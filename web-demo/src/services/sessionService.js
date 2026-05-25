// @ts-nocheck

import { analysisService, isValidPitch } from "./analysisService.js";

export const MIN_SESSION_DURATION_SECONDS = 3;

function getStoredSessions() {
  if (typeof localStorage === "undefined") {
    return [];
  }

  try {
    const parsed = JSON.parse(localStorage.getItem("voiceSessions") || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function notifySessionsChanged(sessions) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("voiceSessions:changed", {
      detail: { sessions, count: sessions.length },
    })
  );
}

export function computeSessionScore(pitch, targetRange) {
  if (!isValidPitch(pitch) || !Array.isArray(targetRange) || targetRange.length !== 2) {
    return null;
  }

  const [low, high] = targetRange;
  if (!Number.isFinite(low) || !Number.isFinite(high) || high <= low) {
    return null;
  }

  const center = (low + high) / 2;
  const margin = (high - low) / 2;
  const distance = Math.abs(pitch - center);

  return Math.max(
    0,
    Math.min(100, Math.round(100 - (distance / (margin * 2)) * 100))
  );
}

export const sessionService = {
  getSessions() {
    return getStoredSessions();
  },

  getSessionCount() {
    return getStoredSessions().length;
  },

  validateSessionData(sessionData) {
    if (!sessionData?.audioData) {
      return { ok: false, error: "No audio data was recorded." };
    }

    const { audioData } = sessionData;
    if (!audioData.blob || audioData.blob.size <= 0) {
      return { ok: false, error: "Recording is empty and was not saved." };
    }

    if (
      !Number.isFinite(audioData.durationSeconds) ||
      audioData.durationSeconds < MIN_SESSION_DURATION_SECONDS
    ) {
      return {
        ok: false,
        error: `Recording is too short. Please record at least ${MIN_SESSION_DURATION_SECONDS} seconds.`,
      };
    }

    const analysis = sessionData.analysis || analysisService.process(audioData);
    if (!analysis.ok || !isValidPitch(analysis.averagePitch)) {
      return {
        ok: false,
        error: analysis.error || "Recording has no valid pitch data and was not saved.",
      };
    }

    return { ok: true, error: null, analysis };
  },

  createSession(sessionData) {
    const validation = this.validateSessionData(sessionData);
    if (!validation.ok) {
      return validation;
    }

    const score = computeSessionScore(
      validation.analysis.averagePitch,
      sessionData.targetRange
    );

    if (!Number.isFinite(score)) {
      return { ok: false, error: "Could not score this recording." };
    }

    const session = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      duration_seconds: Math.round(sessionData.audioData.durationSeconds),
      average_pitch: validation.analysis.averagePitch,
      score,
      exercise_type: sessionData.exerciseType,
      goal: sessionData.goal,
    };

    const existingSessions = getStoredSessions();
    const nextSessions = [...existingSessions, session];
    localStorage.setItem(
      "voiceSessions",
      JSON.stringify(nextSessions)
    );
    notifySessionsChanged(nextSessions);

    return { ok: true, error: null, session };
  },
};
