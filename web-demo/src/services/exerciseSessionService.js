import { MIN_SESSION_DURATION_SECONDS } from "./sessionService.js";
import { exerciseSessionRepository } from "./exerciseSessionRepository.js";
import {
  getSessionFeedback,
  getSessionStatus,
  getTargetHitRate,
  scoreExercise,
} from "./exerciseSessionScoring.js";
import { validateExerciseSessionData } from "./exerciseSessionValidator.js";

const AUDIO_HISTORY_EXERCISE_IDS = new Set(["pronunciation", "diction"]);

function getAverage(values) {
  const clean = values.filter((value) => Number.isFinite(value));
  if (!clean.length) return null;
  return Math.round(clean.reduce((total, value) => total + value, 0) / clean.length);
}

function getResonanceAverage(pitches = []) {
  const values = pitches.map((pitch) => Math.max(200, 250 + pitch * 0.45));
  return getAverage(values);
}

function getGenderAverage(pitches = []) {
  const values = pitches.map((pitch) => Math.max(0, Math.min(100, ((pitch - 120) / 100) * 100)));
  return getAverage(values);
}

function readBlobAsDataUrl(blob) {
  if (!blob || typeof FileReader === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(typeof reader.result === "string" ? reader.result : null), { once: true });
    reader.addEventListener("error", () => resolve(null), { once: true });
    reader.readAsDataURL(blob);
  });
}

export const exerciseSessionService = {
  getSessions() {
    return exerciseSessionRepository.getAll();
  },

  validateExerciseSessionData(sessionData) {
    return validateExerciseSessionData(sessionData);
  },

  async createSession(sessionData) {
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
      session_kind: sessionData.sessionKind || "exercise",
      date: new Date().toISOString(),
      duration_seconds: durationSeconds,
      selected_duration_seconds: selectedDurationSeconds,
      pitch_series: validation.analysis.pitches,
      average_pitch: validation.analysis.averagePitch,
      resonance_average: getResonanceAverage(validation.analysis.pitches),
      gender_average: getGenderAverage(validation.analysis.pitches),
      goal_type: sessionData.exercise.goalType,
      goal: sessionData.exercise.goalLabel,
      target_range: sessionData.targetRange,
      pitch_target_hit_rate: targetHitRate,
      tool_chart_data: sessionData.toolChartData || sessionData.recorderState?.analyticsData || null,
      score,
      feedback: getSessionFeedback(score, completed),
      status: getSessionStatus(score, completed),
      validation_status: completed ? "valid" : "stopped_early",
      completed,
      stopped_early: !completed,
    };

    if (AUDIO_HISTORY_EXERCISE_IDS.has(sessionData.exercise.id)) {
      session.audio_url = await readBlobAsDataUrl(sessionData.audioData.blob);
    }

    exerciseSessionRepository.save(session);

    return { ok: true, error: null, session };
  },

  async createToolSession(sessionData) {
    return this.createSession({
      exercise: {
        id: `voice-analytics-${sessionData.tool.id}`,
        name: sessionData.tool.name,
        goalType: "voice_analytics",
        goalLabel: "Voice Analytics",
      },
      audioData: sessionData.audioData,
      analysis: sessionData.analysis,
      selectedDurationSeconds: sessionData.selectedDurationSeconds,
      targetPitch: null,
      targetRange: null,
      recorderState: sessionData.recorderState,
      toolChartData: sessionData.toolChartData,
      sessionKind: "voice_analytics",
    });
  },
};
