import assert from "node:assert/strict";
import test from "node:test";

const { analysisService, isValidPitch, sanitizePitchSeries } = await import(
  "./analysisService.js"
);

test("pitch validation rejects invalid and unrealistic values", () => {
  for (const value of [NaN, null, undefined, Infinity, -10, 0, 49, 601, 9000]) {
    assert.equal(isValidPitch(value), false);
  }

  assert.equal(isValidPitch(50), true);
  assert.equal(isValidPitch(220), true);
  assert.equal(isValidPitch(600), true);
});

test("sanitizePitchSeries removes invalid pitch data", () => {
  assert.deepEqual(
    sanitizePitchSeries([120.4, NaN, null, Infinity, -5, 230.6, 700]),
    [120, 231]
  );
});

test("analysisService.process returns validated results only", () => {
  const result = analysisService.process({
    blob: new Blob(["audio"]),
    durationSeconds: 4,
    pitches: [100, 200, NaN, Infinity, -1, 700],
  });

  assert.equal(result.ok, true);
  assert.equal(result.averagePitch, 150);
  assert.deepEqual(result.pitches, [100, 200]);
});

test("analysisService.process fails cleanly without valid pitch data", () => {
  const result = analysisService.process({
    blob: new Blob(["audio"]),
    durationSeconds: 4,
    pitches: [NaN, null, Infinity, -1, 999],
  });

  assert.equal(result.ok, false);
  assert.equal(result.averagePitch, null);
});

test("detectPitch finds voice-like sine frequencies", () => {
  const sampleRate = 44100;
  const frequency = 220;
  const buffer = new Float32Array(4096);

  for (let index = 0; index < buffer.length; index += 1) {
    buffer[index] = Math.sin((2 * Math.PI * frequency * index) / sampleRate) * 0.08;
  }

  const pitch = analysisService.detectPitch(buffer, sampleRate);
  assert.ok(Math.abs(pitch - frequency) <= 3);
});
