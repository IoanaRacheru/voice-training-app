import assert from "node:assert/strict";
import test from "node:test";

import { getCanonicalAuthUrl } from "./authRedirect.js";

test("getCanonicalAuthUrl rewrites loopback IP to localhost", () => {
  assert.equal(
    getCanonicalAuthUrl("http://127.0.0.1:5173/profile"),
    "http://localhost:5173/profile"
  );
});

test("getCanonicalAuthUrl leaves regular hostnames unchanged", () => {
  assert.equal(
    getCanonicalAuthUrl("http://localhost:5173/profile"),
    "http://localhost:5173/profile"
  );
  assert.equal(
    getCanonicalAuthUrl("https://example.com/app"),
    "https://example.com/app"
  );
});
