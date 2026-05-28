import assert from "node:assert/strict";
import test from "node:test";

import { getUserDisplayName } from "./userDisplay.js";

test("getUserDisplayName prefers first and last name", () => {
  assert.equal(
    getUserDisplayName({ first_name: "Ada", last_name: "Lovelace", email: "ada@example.com" }),
    "Ada Lovelace"
  );
});

test("getUserDisplayName falls back to full name", () => {
  assert.equal(
    getUserDisplayName({ full_name: "Grace Hopper", email: "grace@example.com" }),
    "Grace Hopper"
  );
});

test("getUserDisplayName can fall back to email", () => {
  assert.equal(
    getUserDisplayName({ email: "user@example.com" }, { fallbackToEmail: true }),
    "user@example.com"
  );
});
