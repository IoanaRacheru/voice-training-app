import assert from "node:assert/strict";
import test from "node:test";

import { createAuthClient } from "./authClientFactory.js";

test("refreshes token and fetches analysis artifact detail", async () => {
  const calls = [];
  const keycloakClient = {
    token: "token-123",
    async updateToken(minValidity) {
      calls.push({ type: "updateToken", minValidity });
    },
  };

  const fetchImpl = async (url, options) => {
    calls.push({ type: "fetch", url, options });
    return {
      ok: true,
      async json() {
        return { id: "artifact-1", summary: "Good stability", practice_next: "Sustain vowels" };
      },
    };
  };

  const client = createAuthClient({
    keycloakClient,
    apiUrl: "http://localhost:3000",
    fetchImpl,
  });

  const artifact = await client.getAnalysisArtifact("artifact-1");

  assert.equal(artifact.id, "artifact-1");
  assert.deepEqual(calls[0], { type: "updateToken", minValidity: 30 });
  assert.equal(calls[1].type, "fetch");
  assert.equal(calls[1].url, "http://localhost:3000/api/analysis-artifacts/artifact-1");
  assert.equal(calls[1].options.headers.Authorization, "Bearer token-123");
});

test("calls challenge endpoints with auth token", async () => {
  const calls = [];
  const keycloakClient = {
    token: "token-abc",
    async updateToken(minValidity) {
      calls.push({ type: "updateToken", minValidity });
    },
  };

  const fetchImpl = async (url, options) => {
    calls.push({ type: "fetch", url, options });
    return {
      ok: true,
      async json() {
        return { ok: true };
      },
    };
  };

  const client = createAuthClient({
    keycloakClient,
    apiUrl: "http://localhost:3000",
    fetchImpl,
  });

  await client.getTodayChallenge("2026-05-29");
  await client.saveGeneratedChallenge({ date: "2026-05-29", challenge: { status: "not_started" } });
  await client.startChallenge({ date: "2026-05-29", challenge: { status: "in_progress" } });
  await client.completeChallengeExercise({ date: "2026-05-29", challenge: { status: "completed" } });
  await client.getChallengeStreak();

  const urls = calls.filter((c) => c.type === "fetch").map((c) => c.url);
  assert.equal(urls[0], "http://localhost:3000/api/challenge/today?date=2026-05-29");
  assert.equal(urls[1], "http://localhost:3000/api/challenge/generate");
  assert.equal(urls[2], "http://localhost:3000/api/challenge/start");
  assert.equal(urls[3], "http://localhost:3000/api/challenge/complete-exercise");
  assert.equal(urls[4], "http://localhost:3000/api/challenge/streak");
});

test("calls chat endpoint and returns reply payload", async () => {
  const keycloakClient = {
    token: "token-chat",
    async updateToken() {},
  };
  const client = createAuthClient({
    keycloakClient,
    apiUrl: "http://localhost:3000",
    fetchImpl: async () => ({
      ok: true,
      async json() {
        return { reply: "Coach response" };
      },
    }),
  });

  const response = await client.chat({ message: "help me", context: "score 70" });
  assert.equal(response.reply, "Coach response");
});
