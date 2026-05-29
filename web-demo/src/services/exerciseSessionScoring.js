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

export function getTargetHitRate(pitches, targetRange) {
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

export function scoreExercise({ exercise, analysis, durationSeconds, selectedDurationSeconds, targetPitch }) {
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

export function getSessionFeedback(score, completed) {
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

export function getSessionStatus(score, completed) {
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

