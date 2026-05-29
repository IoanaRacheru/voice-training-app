import { MIN_SESSION_DURATION_SECONDS } from "./sessionService.js";
import { exerciseSessionRepository } from "./exerciseSessionRepository.js";
import {
  analyzeVoice,
  createSession as createSessionApi,
  getSessions as getSessionsApi,
} from "@/api/authClient";
import {
  getSessionFeedback,
  getSessionStatus,
  getTargetHitRate,
  scoreExercise,
} from "./exerciseSessionScoring.js";
import { validateExerciseSessionData } from "./exerciseSessionValidator.js";

const AUDIO_HISTORY_EXERCISE_IDS = new Set(["pronunciation", "diction"]);
const backendStatus = {
  sessionsApiAvailable: true,
  analyzeApiAvailable: true,
  createSessionApiAvailable: true,
};

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

async function decodeAudioForAnalyze(blob) {
  if (!blob || typeof window === "undefined") return null;
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) return null;

  const audioContext = new AudioContextCtor();
  try {
    const buffer = await blob.arrayBuffer();
    const decoded = await audioContext.decodeAudioData(buffer.slice(0));
    if (!decoded || decoded.length <= 0) return null;
    const firstChannel = decoded.getChannelData(0);
    const maxSamples = 16000 * 30;
    const trimmed = firstChannel.length > maxSamples ? firstChannel.slice(0, maxSamples) : firstChannel;
    return {
      audio_samples: Array.from(trimmed),
      sample_rate: decoded.sampleRate,
    };
  } catch (_error) {
    return null;
  } finally {
    await audioContext.close().catch(() => {});
  }
}

function normalizeEnumLike(value, fallback) {
  if (!value || typeof value !== "string") return fallback;
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return normalized || fallback;
}

function estimatePitchStability(pitches = []) {
  const clean = pitches.filter((value) => Number.isFinite(value));
  if (clean.length < 2) return 0.5;
  const mean = clean.reduce((total, value) => total + value, 0) / clean.length;
  const variance =
    clean.reduce((total, value) => total + (value - mean) ** 2, 0) / clean.length;
  const stdDev = Math.sqrt(variance);
  if (!Number.isFinite(mean) || mean <= 0) return 0.5;
  return Math.max(0, Math.min(1, 1 - Math.min(1, stdDev / mean)));
}

export const exerciseSessionService = {
  async getSessions() {
    try {
      const apiSessions = await getSessionsApi();
      backendStatus.sessionsApiAvailable = true;
      return Array.isArray(apiSessions) ? apiSessions : [];
    } catch (_error) {
      backendStatus.sessionsApiAvailable = false;
      return exerciseSessionRepository.getAll();
    }
  },

  getBackendStatus() {
    return { ...backendStatus };
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

    // Feed real backend analyze pipeline and attach returned diagnostics.
    try {
      const audioAnalyzeData = await decodeAudioForAnalyze(sessionData.audioData.blob);
      const expectedText = sessionData.exercise?.shortInstruction || sessionData.exercise?.name || null;
      const analyzePayload = {
        median_pitch_hz: Number.isFinite(validation.analysis.averagePitch)
          ? validation.analysis.averagePitch
          : 150.0,
        pitch_stability: estimatePitchStability(validation.analysis.pitches),
        pause_ratio: 0.2,
        spectral_brightness: 0.6,
        audio_samples: audioAnalyzeData?.audio_samples || null,
        sample_rate: audioAnalyzeData?.sample_rate || null,
        expected_text: expectedText,
      };
      const analyzeResult = await analyzeVoice(analyzePayload);
      backendStatus.analyzeApiAvailable = true;
      session.backend_analysis = {
        summary: analyzeResult.summary,
        practice_next: analyzeResult.practice_next,
        llm_coach_feedback: analyzeResult.llm_coach_feedback,
        vad_used: analyzeResult.vad_used,
        voice_presentation: analyzeResult.voice_presentation,
        asr: analyzeResult.asr,
        pronunciation: analyzeResult.pronunciation,
      };
    } catch (_error) {
      // Keep local save resilient when backend analyze is temporarily unavailable.
      backendStatus.analyzeApiAvailable = false;
      session.backend_analysis = null;
    }

    // Persist canonical session to backend when possible.
    try {
      await createSessionApi({
        duration_seconds: session.duration_seconds,
        average_pitch: Number.isFinite(session.average_pitch) ? session.average_pitch : 150.0,
        score: Number.isFinite(session.score) ? session.score : 0,
        exercise_type: normalizeEnumLike(session.exercise_id, "exercise"),
        goal: normalizeEnumLike(session.goal_type || session.goal, "general_training"),
      });
      backendStatus.createSessionApiAvailable = true;
    } catch (_error) {
      // Local repository remains fallback source if backend persistence fails.
      backendStatus.createSessionApiAvailable = false;
    }

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
