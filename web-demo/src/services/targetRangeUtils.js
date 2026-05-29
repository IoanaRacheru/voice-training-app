import {
  getDefaultPitchRangeForGoal,
  normalizePitchRange,
} from "../lib/profilePreferences.js";

export function resolveTargetRange(user, snapshot) {
  if (user?.pitch_target_enabled === false) {
    return null;
  }

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
    return getDefaultPitchRangeForGoal("feminine");
  }

  if (snapshot?.goal === "masculinization") {
    return getDefaultPitchRangeForGoal("masculine");
  }

  return normalizePitchRange(null, "feminine");
}
