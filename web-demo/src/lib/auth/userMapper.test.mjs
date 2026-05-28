import assert from "node:assert/strict";
import test from "node:test";

const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
};

const { mapApiUserToAppUser } = await import("./userMapper.js");

test("mapApiUserToAppUser maps identity and defaults", () => {
  const user = mapApiUserToAppUser({
    user_id: "abc",
    email: "test@example.com",
    name: "Test User",
  });

  assert.equal(user.id, "abc");
  assert.equal(user.username, "test");
  assert.equal(user.full_name, "Test User");
  assert.deepEqual(user.training_focus, ["pitch"]);
});

