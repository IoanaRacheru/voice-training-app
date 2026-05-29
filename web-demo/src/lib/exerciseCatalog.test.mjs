import test from "node:test";
import assert from "node:assert/strict";

import { exercises } from "../data/exercises.js";

test("new guided exercise catalog entries exist", () => {
  const ids = new Set(exercises.map((exercise) => exercise.id));
  assert.equal(ids.has("bubble-phonation"), true);
  assert.equal(ids.has("resonance-humming"), true);
  assert.equal(ids.has("breathing-control"), true);
  assert.equal(ids.has("hydration-break"), false);
  assert.equal(ids.has("larynx-raise-tutorial"), true);
});

test("guided exercise entries include typed experience metadata", () => {
  const guided = exercises.filter((exercise) => exercise.experience);
  assert.ok(guided.length >= 4);
  for (const exercise of guided) {
    assert.equal(typeof exercise.experience.focus, "string");
    assert.ok(Array.isArray(exercise.experience.steps));
    assert.ok(exercise.experience.steps.length > 0);
  }
});
