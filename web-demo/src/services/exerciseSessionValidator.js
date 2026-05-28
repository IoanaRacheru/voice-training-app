import { analysisService } from "./analysisService.js";
import { MIN_SESSION_DURATION_SECONDS } from "./sessionService.js";

export function validateExerciseSessionData(sessionData) {
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
}

