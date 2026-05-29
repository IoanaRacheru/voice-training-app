export const PROFILE_GOALS = {
  FEMININE: "feminine",
  MASCULINE: "masculine",
};
const PROFILE_PREFERENCES_OVERRIDE_KEY = "voiceProfilePreferencesOverride";

function readPreferenceOverrides() {
  if (typeof localStorage === "undefined") {
    return {};
  }

  try {
    const parsed = JSON.parse(localStorage.getItem(PROFILE_PREFERENCES_OVERRIDE_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_error) {
    return {};
  }
}

export function savePreferenceOverrides(updates) {
  if (typeof localStorage === "undefined") {
    return;
  }

  const current = readPreferenceOverrides();
  localStorage.setItem(
    PROFILE_PREFERENCES_OVERRIDE_KEY,
    JSON.stringify({ ...current, ...updates })
  );
}


export function normalizeVoiceGoal(goal) {
  const normalized = String(goal || "").toLowerCase();
  return normalized === "masculinize" || normalized === "masculine"
    ? "masculine"
    : "feminine";
}

export function getDefaultPitchRangeForGoal(goal) {
  return normalizeVoiceGoal(goal) === PROFILE_GOALS.MASCULINE
    ? [100, 150]
    : [180, 240];
}

export function normalizePitchRange(range, goal) {
  if (
    Array.isArray(range) &&
    range.length === 2 &&
    Number.isFinite(Number(range[0])) &&
    Number.isFinite(Number(range[1])) &&
    Number(range[1]) > Number(range[0])
  ) {
    return [Number(range[0]), Number(range[1])];
  }
  return getDefaultPitchRangeForGoal(goal);
}

export function getSavedProfilePreferences(user) {
  const overrides = readPreferenceOverrides();
  const voiceGoal = normalizeVoiceGoal(user?.voice_goal);
  const goal = normalizeVoiceGoal(overrides.voice_goal ?? voiceGoal);
  return {
    voice_goal: goal,
    target_pitch_range: normalizePitchRange(
      overrides.target_pitch_range ?? user?.target_pitch_range,
      goal
    ),
    pitch_target_enabled:
      overrides.pitch_target_enabled === undefined
        ? user?.pitch_target_enabled !== false
        : Boolean(overrides.pitch_target_enabled),
  };
}

export function getSavedBackground(user) {
  return {
    identity_background: user?.identity_background || "",
    puberty_background: user?.puberty_background || "",
    age: user?.age === undefined || user?.age === null ? "" : String(user.age),
  };
}
