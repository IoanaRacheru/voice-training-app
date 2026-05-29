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
