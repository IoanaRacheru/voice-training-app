
export function createAuthClient({
  keycloakClient,
  apiUrl,
  fetchImpl = fetch,
}) {
  async function request(path, options = {}) {
    await keycloakClient.updateToken(30);
    const { headers: optHeaders, ...rest } = options;
    const res = await fetchImpl(`${apiUrl}${path}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${keycloakClient.token}`,
        ...optHeaders,
      },
      ...rest,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Request failed");
    return data;
  }

  return {
    getMe() {
      return request("/api/me");
    },

    patchMe(updates) {
      return request("/api/me", {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
    },

    createSession(session) {
      return request("/api/sessions", {
        method: "POST",
        body: JSON.stringify(session),
      });
    },

    getSessions() {
      return request("/api/sessions");
    },

    analyzeVoice(payload) {
      return request("/api/analyze", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    listAnalysisArtifacts({ limit = 20, offset = 0 } = {}) {
      const query = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      });
      return request(`/api/analysis-artifacts?${query.toString()}`);
    },

    getAnalysisArtifact(id) {
      return request(`/api/analysis-artifacts/${id}`);
    },

    getTodayChallenge(date) {
      const query = new URLSearchParams({ date });
      return request(`/api/challenge/today?${query.toString()}`);
    },

    saveGeneratedChallenge(payload) {
      return request("/api/challenge/generate", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    startChallenge(payload) {
      return request("/api/challenge/start", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    completeChallengeExercise(payload) {
      return request("/api/challenge/complete-exercise", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    getChallengeStreak() {
      return request("/api/challenge/streak");
    },

    planChallenge(payload) {
      return request("/api/challenge/plan", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    chat(payload) {
      return request("/api/chat", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
  };
}
