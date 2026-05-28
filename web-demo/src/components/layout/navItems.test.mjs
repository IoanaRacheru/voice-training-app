import assert from "node:assert/strict";
import test from "node:test";

import { navItems } from "./navItems.js";

test("sidebar navigation order matches product requirements", () => {
  assert.deepEqual(
    navItems.map((item) => item.label),
    [
      "Profile",
      "Challenge",
      "Exercises and Tools",
      "Progress",
      "Tutorials",
      "Chatbot",
    ]
  );
});
