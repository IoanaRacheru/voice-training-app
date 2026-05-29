import assert from "node:assert/strict";
import test from "node:test";

import { createLocalJsonStore } from "./localJsonStore.js";

test("localJsonStore returns fallback on missing storage values", () => {
  const storage = new Map();
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  };

  const store = createLocalJsonStore("x", () => ({ ok: true }));
  assert.deepEqual(store.read(), { ok: true });
});

test("localJsonStore writes and reads JSON safely", () => {
  const storage = new Map();
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  };

  const store = createLocalJsonStore("sessions", () => []);
  store.write([{ id: "1" }]);
  assert.deepEqual(store.read(), [{ id: "1" }]);
});

