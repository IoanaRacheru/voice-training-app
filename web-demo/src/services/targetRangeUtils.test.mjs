import assert from "node:assert/strict";
import test from "node:test";

import { resolveTargetRange } from "./targetRangeUtils.js";

test("resolveTargetRange disables target range when pitch targeting is off", () => {
  const range = resolveTargetRange(
    {
      pitch_target_enabled: false,
      target_pitch_range: [180, 240],
    },
    { goal: "feminization" }
  );
  assert.equal(range, null);
});

test("resolveTargetRange uses saved range when valid", () => {
  const range = resolveTargetRange(
    {
      pitch_target_enabled: true,
      target_pitch_range: [120, 170],
    },
    { goal: "masculinization" }
  );
  assert.deepEqual(range, [120, 170]);
});

test("resolveTargetRange falls back to goal defaults", () => {
  assert.deepEqual(resolveTargetRange({}, { goal: "feminization" }), [180, 240]);
  assert.deepEqual(resolveTargetRange({}, { goal: "masculinization" }), [100, 150]);
});
