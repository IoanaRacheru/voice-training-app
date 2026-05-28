/**
 * Returns true when profile updates include preference fields that should be synced locally.
 */
export function shouldSyncPreferenceOverrides(updates) {
  return (
    "voice_goal" in updates ||
    "target_pitch_range" in updates ||
    "pitch_target_enabled" in updates
  );
}

/**
 * Picks only preference fields from generic user updates.
 */
export function pickPreferenceOverrides(updates) {
  return {
    voice_goal: updates.voice_goal,
    target_pitch_range: updates.target_pitch_range,
    pitch_target_enabled: updates.pitch_target_enabled,
  };
}

