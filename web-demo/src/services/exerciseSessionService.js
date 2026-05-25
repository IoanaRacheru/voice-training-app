// @ts-nocheck

import { analysisService } from "./analysisService.js";
import { MIN_SESSION_DURATION_SECONDS } from "./sessionService.js";

const STORAGE_KEY = "voiceExerciseSessions";

function getStoredExerciseSessions() {
  if (typeof localStorage === "undefined") {
    return [];
  }

  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function notifyExerciseSessionsChanged(sessions) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("voiceExerciseSessions:changed", {
      detail: { sessions, count: sessions.length },
    })
  );
}

function clampScore(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function getPitchStabilityScore(pitches) {
  if (!pitches.length) {
    return 0;
  }

  const average = pitches.reduce((total, pitch) => total + pitch, 0) / pitches.length;
  const variance =
    pitches.reduce((total, pitch) => total + (pitch - average) ** 2, 0) / pitches.length;
  const deviation = Math.sqrt(variance);
  return clampScore(100 - deviation * 1.8);
}

function getPitchMatchingScore(pitches, targetPitch) {
  if (!pitches.length || !Number.isFinite(targetPitch)) {
    return getPitchStabilityScore(pitches);
  }

  const averageDistance =
    pitches.reduce((total, pitch) => total + Math.abs(pitch - targetPitch), 0) / pitches.length;
  return clampScore(100 - averageDistance * 1.4);
}

function getDurationScore(durationSeconds, selectedDurationSeconds) {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return 0;
  }

  const expectedDuration = Number.isFinite(selectedDurationSeconds)
    ? selectedDurationSeconds
    : 60;
  return clampScore((durationSeconds / expectedDuration) * 100);
}

function getTargetHitRate(pitches, targetRange) {
  if (!pitches.length || !Array.isArray(targetRange) || targetRange.length !== 2) {
    return null;
  }

  const [low, high] = targetRange;
  if (!Number.isFinite(low) || !Number.isFinite(high) || high <= low) {
    return null;
  }

  const hits = pitches.filter((pitch) => pitch >= low && pitch <= high).length;
  return clampScore((hits / pitches.length) * 100);
}

function scoreExercise({ exercise, analysis, durationSeconds, selectedDurationSeconds, targetPitch }) {
  const pitches = analysis?.pitches || [];
  const stabilityScore = getPitchStabilityScore(pitches);
  const durationScore = getDurationScore(durationSeconds, selectedDurationSeconds);

  switch (exercise.goalType) {
    case "duration":
      return clampScore(durationScore * 0.7 + stabilityScore * 0.3);
    case "pitch_matching":
      return getPitchMatchingScore(pitches, targetPitch);
    case "clarity_and_speed":
      return clampScore(stabilityScore * 0.5 + durationScore * 0.5);
    case "overall_consistency":
      return clampScore(stabilityScore * 0.65 + durationScore * 0.35);
    default:
      return stabilityScore;
  }
}

function getFeedback(score, completed) {
  if (!completed) {
    return "Stopped early. Try completing the selected timer next time.";
  }

  if (score >= 85) {
    return "Strong control for this goal. Keep repeating at the same comfort level.";
  }

  if (score >= 65) {
    return "Solid take. Smooth out the bigger pitch or intensity changes.";
  }

  return "Useful baseline. Slow down, relax the throat, and try a shorter phrase.";
}

function getStatus(score, completed) {
  if (!completed) {
    return "stopped_early";
  }

  if (score >= 85) {
    return "excellent";
  }

  if (score >= 65) {
    return "solid";
  }

  return "needs_work";
}

export const exerciseSessionService = {
  getSessions() {
    return getStoredExerciseSessions();
  },

  validateExerciseSessionData(sessionData) {
    if (!sessionData?.exercise) {
      return { ok: false, error: "No exercise was selected." };
    }

    if (!sessionData.audioData) {
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
    if (!analysis.ok || !analysis.pitches?.length) {
      return {
        ok: false,
        error: analysis.error || "Recording has no valid pitch data and was not saved.",
      };
    }

    return { ok: true, error: null, analysis };
  },

  createSession(sessionData) {
    const validation = this.validateExerciseSessionData(sessionData);
    if (!validation.ok) {
      return validation;
    }

    const durationSeconds = Math.round(sessionData.audioData.durationSeconds);
    const selectedDurationSeconds = sessionData.selectedDurationSeconds;
    const completed = durationSeconds >= Math.max(MIN_SESSION_DURATION_SECONDS, selectedDurationSeconds - 1);
    const score = scoreExercise({
      exercise: sessionData.exercise,
      analysis: validation.analysis,
      durationSeconds,
      selectedDurationSeconds,
      targetPitch: sessionData.targetPitch,
    });
    const targetHitRate = getTargetHitRate(
      validation.analysis.pitches,
      sessionData.targetRange
    );

    const session = {
      id: crypto.randomUUID(),
      exercise_id: sessionData.exercise.id,
      exercise_name: sessionData.exercise.name,
      date: new Date().toISOString(),
      duration_seconds: durationSeconds,
      selected_duration_seconds: selectedDurationSeconds,
      average_pitch: validation.analysis.averagePitch,
      goal_type: sessionData.exercise.goalType,
      goal: sessionData.exercise.goalLabel,
      target_range: sessionData.targetRange,
      pitch_target_hit_rate: targetHitRate,
      score,
      feedback: getFeedback(score, completed),
      status: getStatus(score, completed),
      completed,
      stopped_early: !completed,
    };

    const nextSessions = [...getStoredExerciseSessions(), session];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSessions));
    notifyExerciseSessionsChanged(nextSessions);

    return { ok: true, error: null, session };
  },
};
