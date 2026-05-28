import { getSavedProfilePreferences } from "../profilePreferences.js";

/**
 * Builds the app-level user model from API payload + locally saved preferences.
 */
export function mapApiUserToAppUser(data) {
  const preferences = getSavedProfilePreferences(data);
  return {
    id: data.user_id,
    username: data.email?.split("@")[0] ?? data.user_id,
    email: data.email,
    first_name: data.first_name,
    last_name: data.last_name,
    full_name: data.full_name ?? data.name,
    voice_goal: preferences.voice_goal,
    experience_level: data.experience_level,
    target_pitch_range: preferences.target_pitch_range,
    pitch_target_enabled: preferences.pitch_target_enabled,
    training_focus: data.training_focus ?? ["pitch"],
    identity_background: data.identity_background,
    personalization_goals: data.personalization_goals,
    age: data.age,
    puberty_background: data.puberty_background,
    initial_voice_sample: data.initial_voice_sample,
  };
}
