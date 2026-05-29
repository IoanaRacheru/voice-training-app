
export function shouldSyncPreferenceOverrides(updates) {
  return (
    "voice_goal" in updates ||
    "target_pitch_range" in updates ||
    "pitch_target_enabled" in updates
  );
}


export function pickPreferenceOverrides(updates) {
  return {
    voice_goal: updates.voice_goal,
    target_pitch_range: updates.target_pitch_range,
    pitch_target_enabled: updates.pitch_target_enabled,
  };
}

