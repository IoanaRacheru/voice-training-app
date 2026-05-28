import { MIN_SESSION_DURATION_SECONDS } from "./sessionService.js";
import { exerciseSessionRepository } from "./exerciseSessionRepository.js";
import {
  getSessionFeedback,
  getSessionStatus,
  getTargetHitRate,
  scoreExercise,
} from "./exerciseSessionScoring.js";
import { validateExerciseSessionData } from "./exerciseSessionValidator.js";

export const exerciseSessionService = {
  getSessions() {
    return exerciseSessionRepository.getAll();
  },

  validateExerciseSessionData(sessionData) {
    return validateExerciseSessionData(sessionData);
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
      feedback: getSessionFeedback(score, completed),
      status: getSessionStatus(score, completed),
      completed,
      stopped_early: !completed,
    };

    exerciseSessionRepository.save(session);

    return { ok: true, error: null, session };
  },
};
