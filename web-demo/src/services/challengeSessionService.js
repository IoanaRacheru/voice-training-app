// @ts-nocheck

import { analysisService } from "./analysisService.js";
import { challengeGeneratorService } from "./challengeGeneratorService.js";
import { challengeStreakService } from "./challengeStreakService.js";
import { MIN_SESSION_DURATION_SECONDS } from "./sessionService.js";

const STORAGE_KEY = "voiceDailyChallenge";

function readChallenge() {
  if (typeof localStorage === "undefined") {
    return null;
  }

  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (_error) {
    return null;
  }
}

function writeChallenge(challenge) {
  if (typeof localStorage === "undefined") {
    return challenge;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(challenge));
  window.dispatchEvent(
    new CustomEvent("voiceDailyChallenge:changed", { detail: challenge })
  );
  return challenge;
}

function clampScore(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function getTargetRange(user, snapshot) {
  const targetRange = user?.target_pitch_range || snapshot?.targetPitchRange;
  if (
    Array.isArray(targetRange) &&
    targetRange.length === 2 &&
    Number.isFinite(Number(targetRange[0])) &&
    Number.isFinite(Number(targetRange[1])) &&
    Number(targetRange[1]) > Number(targetRange[0])
  ) {
    return [Number(targetRange[0]), Number(targetRange[1])];
  }

  if (snapshot?.goal === "feminization") {
    return [180, 240];
  }

  if (snapshot?.goal === "masculinization") {
    return [100, 150];
  }

  return [120, 220];
}

function getPitchHitRate(pitches, targetRange) {
  if (!pitches?.length) {
    return null;
  }

  const hits = pitches.filter((pitch) => pitch >= targetRange[0] && pitch <= targetRange[1]).length;
  return clampScore((hits / pitches.length) * 100);
}

function getStabilityScore(pitches) {
  if (!pitches?.length) {
    return 0;
  }

  const average = pitches.reduce((total, pitch) => total + pitch, 0) / pitches.length;
  const variance =
    pitches.reduce((total, pitch) => total + (pitch - average) ** 2, 0) / pitches.length;
  return clampScore(100 - Math.sqrt(variance) * 1.6);
}

function scoreResult({ exercise, analysis, durationSeconds, targetRange }) {
  const durationScore = clampScore((durationSeconds / exercise.durationSeconds) * 100);

  if (exercise.requiresPitch) {
    const hitRate = getPitchHitRate(analysis.pitches, targetRange) || 0;
    const stabilityScore = getStabilityScore(analysis.pitches);
    return clampScore(hitRate * 0.55 + stabilityScore * 0.3 + durationScore * 0.15);
  }

  return clampScore(durationScore * 0.75 + 20);
}

function validateResult({ exercise, audioData, analysis }) {
  if (!audioData?.blob || audioData.blob.size <= 0) {
    return { ok: false, error: "No recording was captured. Try again." };
  }

  if (
    !Number.isFinite(audioData.durationSeconds) ||
    audioData.durationSeconds < MIN_SESSION_DURATION_SECONDS
  ) {
    return {
      ok: false,
      error: `Recording is too short. Record at least ${MIN_SESSION_DURATION_SECONDS} seconds.`,
    };
  }

  const minimumRequiredDuration = Math.max(
    MIN_SESSION_DURATION_SECONDS,
    exercise.durationSeconds * 0.8
  );
  if (audioData.durationSeconds < minimumRequiredDuration) {
    return {
      ok: false,
      error: "This challenge step needs a fuller take. Let the timer run closer to the end.",
    };
  }

  if (exercise.requiresPitch && (!analysis.ok || !analysis.pitches?.length)) {
    return {
      ok: false,
      error: analysis.error || "No valid pitch data was detected. Try again closer to the mic.",
    };
  }

  return { ok: true, error: null };
}

export const challengeSessionService = {
  getTargetRange,

  getTodayChallenge(user) {
    const today = challengeGeneratorService.getToday();
    const existing = readChallenge();

    if (existing?.date === today) {
      return existing;
    }

    return null;
  },

  generateChallenge(user, exerciseCount) {
    return writeChallenge(
      challengeGeneratorService.generateDailyChallenge({ user, exerciseCount })
    );
  },

  startChallenge(challenge) {
    const nextChallenge = {
      ...challenge,
      orderLocked: true,
      status: "in_progress",
      startedAt: challenge.startedAt || new Date().toISOString(),
      exercises: challenge.exercises.map((exercise, index) => ({
        ...exercise,
        status:
          index === challenge.currentExerciseIndex
            ? "available"
            : exercise.status === "completed"
              ? "completed"
              : "locked",
      })),
    };

    return writeChallenge(nextChallenge);
  },

  reorderExercise(challenge, fromIndex, direction) {
    if (challenge.orderLocked) {
      return challenge;
    }

    const toIndex = fromIndex + direction;
    if (toIndex < 0 || toIndex >= challenge.exercises.length) {
      return challenge;
    }

    const exercises = [...challenge.exercises];
    [exercises[fromIndex], exercises[toIndex]] = [exercises[toIndex], exercises[fromIndex]];

    return writeChallenge({
      ...challenge,
      exercises: exercises.map((exercise, index) => ({
        ...exercise,
        order: index,
        status: index === 0 ? "available" : "locked",
      })),
    });
  },

  completeExercise({ challenge, exerciseIndex, audioData, user }) {
    const exercise = challenge.exercises[exerciseIndex];
    const analysis = analysisService.process(audioData);
    const validation = validateResult({ exercise, audioData, analysis });

    if (!validation.ok) {
      return validation;
    }

    const targetRange = getTargetRange(user, challenge.profileGoalSnapshot);
    const durationSeconds = Math.round(audioData.durationSeconds);
    const score = scoreResult({ exercise, analysis, durationSeconds, targetRange });
    const result = {
      challengeExerciseId: exercise.challengeId,
      exerciseId: exercise.id,
      title: exercise.title,
      completedAt: new Date().toISOString(),
      durationSeconds,
      score,
      averagePitch: analysis.ok ? analysis.averagePitch : null,
      pitchTargetHitRate: exercise.requiresPitch
        ? getPitchHitRate(analysis.pitches, targetRange)
        : null,
      feedback:
        score >= 80
          ? "Strong take. You handled this step well."
          : "Valid take. Repeat later for smoother control.",
    };

    const exercises = challenge.exercises.map((item, index) => {
      if (index === exerciseIndex) {
        return { ...item, status: "completed", progress: 100 };
      }

      if (index === exerciseIndex + 1) {
        return { ...item, status: "available", progress: 0 };
      }

      return item;
    });
    const results = [
      ...challenge.results.filter(
        (item) => item.challengeExerciseId !== exercise.challengeId
      ),
      result,
    ];
    const allCompleted = exercises.every((item) => item.status === "completed");
    const nextChallenge = {
      ...challenge,
      exercises,
      results,
      currentExerciseIndex: allCompleted
        ? exerciseIndex
        : Math.min(exerciseIndex + 1, exercises.length - 1),
      status: allCompleted ? "completed" : "in_progress",
      completedAt: allCompleted ? new Date().toISOString() : challenge.completedAt,
    };

    if (allCompleted) {
      challengeStreakService.completeChallenge(challenge.date);
    }

    return { ok: true, error: null, challenge: writeChallenge(nextChallenge), result };
  },
};
