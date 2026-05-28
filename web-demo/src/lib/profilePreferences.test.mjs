import assert from "node:assert/strict";
import test from "node:test";

import {
  getDefaultPitchRangeForGoal,
  getSavedBackground,
  getSavedProfilePreferences,
  normalizeVoiceGoal,
} from "./profilePreferences.js";

test("normalizeVoiceGoal constrains legacy values", () => {
  assert.equal(normalizeVoiceGoal("feminize"), "feminine");
  assert.equal(normalizeVoiceGoal("masculinize"), "masculine");
  assert.equal(normalizeVoiceGoal("androgynous"), "feminine");
});

test("getSavedProfilePreferences keeps explicit pitch toggle and valid range", () => {
  const preferences = getSavedProfilePreferences({
    voice_goal: "masculinize",
    target_pitch_range: [110, 160],
    pitch_target_enabled: false,
  });

  assert.deepEqual(preferences, {
    voice_goal: "masculine",
    target_pitch_range: [110, 160],
    pitch_target_enabled: false,
  });
});

test("getSavedProfilePreferences applies defaults when data is missing", () => {
  const preferences = getSavedProfilePreferences({});
  assert.equal(preferences.voice_goal, "feminine");
  assert.deepEqual(preferences.target_pitch_range, getDefaultPitchRangeForGoal("feminine"));
  assert.equal(preferences.pitch_target_enabled, true);
});

test("getSavedBackground keeps expected fields only", () => {
  const background = getSavedBackground({
    identity_background: "context",
    puberty_background: "post_puberty_voice",
    age: 29,
    personalization_goals: ["ignored"],
  });

  assert.deepEqual(background, {
    identity_background: "context",
    puberty_background: "post_puberty_voice",
    age: "29",
  });
});
