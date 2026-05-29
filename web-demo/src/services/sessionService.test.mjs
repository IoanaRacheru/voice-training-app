import assert from "node:assert/strict";
import test from "node:test";

Object.defineProperty(globalThis, "crypto", {
  configurable: true,
  value: {
    randomUUID: () => "test-session-id",
  },
});

const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
};
globalThis.window = {
  dispatchEvent: () => {},
};
globalThis.CustomEvent = class CustomEvent {
  constructor(type, init = {}) {
    this.type = type;
    this.detail = init.detail;
  }
};

const { computeSessionScore, sessionService } = await import("./sessionService.js");

test("computeSessionScore rejects invalid pitch and target ranges", () => {
  assert.equal(computeSessionScore(NaN, [100, 200]), null);
  assert.equal(computeSessionScore(150, [200, 100]), null);
  assert.equal(computeSessionScore(150, null), null);
});

test("sessionService rejects empty audio", () => {
  const result = sessionService.createSession({
    audioData: { blob: new Blob([]), durationSeconds: 5, pitches: [150] },
    targetRange: [100, 200],
    exerciseType: "pitch",
    goal: "custom",
  });

  assert.equal(result.ok, false);
});

test("sessionService rejects accidental short recordings", () => {
  const result = sessionService.createSession({
    audioData: { blob: new Blob(["audio"]), durationSeconds: 1, pitches: [150] },
    targetRange: [100, 200],
    exerciseType: "pitch",
    goal: "custom",
  });

  assert.equal(result.ok, false);
  assert.match(result.error, /too short/i);
});

test("sessionService rejects failed analysis", () => {
  const result = sessionService.createSession({
    audioData: { blob: new Blob(["audio"]), durationSeconds: 5, pitches: [150] },
    analysis: { ok: false, error: "bad analysis", averagePitch: null },
    targetRange: [100, 200],
    exerciseType: "pitch",
    goal: "custom",
  });

  assert.equal(result.ok, false);
  assert.equal(result.error, "bad analysis");
});

test("sessionService saves valid sessions", () => {
  storage.clear();

  const result = sessionService.createSession({
    audioData: { blob: new Blob(["audio"]), durationSeconds: 5.4, pitches: [150] },
    analysis: { ok: true, error: null, averagePitch: 150 },
    targetRange: [100, 200],
    exerciseType: "pitch",
    goal: "custom",
  });

  assert.equal(result.ok, true);
  assert.equal(result.session.id, "test-session-id");
  assert.equal(JSON.parse(globalThis.localStorage.getItem("voiceSessions")).length, 1);
  assert.equal(sessionService.getSessionCount(), 1);
});
