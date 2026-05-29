import assert from "node:assert/strict";
import test from "node:test";

import {
  mapExerciseTypeForBackend,
  mapGoalForBackend,
} from "./sessionPayloadMapper.js";

test("mapExerciseTypeForBackend maps known exercise ids into backend enums", () => {
  assert.equal(mapExerciseTypeForBackend("bubble-phonation"), "resonance");
  assert.equal(mapExerciseTypeForBackend("pitch-control"), "pitch");
  assert.equal(mapExerciseTypeForBackend("diction"), "intonation");
  assert.equal(mapExerciseTypeForBackend("breathing-control"), "breath_control");
});

test("mapExerciseTypeForBackend falls back to pitch for unknown values", () => {
  assert.equal(mapExerciseTypeForBackend("something-new"), "pitch");
});

test("mapGoalForBackend maps feminine and masculine families", () => {
  assert.equal(mapGoalForBackend("feminine", ""), "feminize");
  assert.equal(mapGoalForBackend("feminize", ""), "feminize");
  assert.equal(mapGoalForBackend("masculine", ""), "masculinize");
  assert.equal(mapGoalForBackend("masculinize", ""), "masculinize");
});

test("mapGoalForBackend maps androgynous and defaults to custom", () => {
  assert.equal(mapGoalForBackend("androgynous", ""), "androgynous");
  assert.equal(mapGoalForBackend("resonance_consistency", "Resonance consistency"), "custom");
});
