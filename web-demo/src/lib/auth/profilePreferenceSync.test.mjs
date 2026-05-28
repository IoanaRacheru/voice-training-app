import assert from "node:assert/strict";
import test from "node:test";

const {
  pickPreferenceOverrides,
  shouldSyncPreferenceOverrides,
} = await import("./profilePreferenceSync.js");

test("shouldSyncPreferenceOverrides detects profile preference changes", () => {
  assert.equal(shouldSyncPreferenceOverrides({ voice_goal: "feminine" }), true);
  assert.equal(shouldSyncPreferenceOverrides({ target_pitch_range: [180, 240] }), true);
  assert.equal(shouldSyncPreferenceOverrides({ age: "20" }), false);
});

test("pickPreferenceOverrides returns only preference fields", () => {
  assert.deepEqual(
    pickPreferenceOverrides({
      voice_goal: "masculine",
      age: "24",
      pitch_target_enabled: false,
    }),
    {
      voice_goal: "masculine",
      target_pitch_range: undefined,
      pitch_target_enabled: false,
    }
  );
});

