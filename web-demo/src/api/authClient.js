import keycloak from "@/lib/keycloak";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

async function request(path, options = {}) {
  await keycloak.updateToken(30);
  const { headers: optHeaders, ...rest } = options;
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${keycloak.token}`,
      ...optHeaders,
    },
    ...rest,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data;
}

export function getMe() {
  return request("/api/me");
}

export function patchMe(updates) {
  return request("/api/me", {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export function createSession(session) {
  return request("/api/sessions", {
    method: "POST",
    body: JSON.stringify(session),
  });
}

export function getSessions() {
  return request("/api/sessions");
}
