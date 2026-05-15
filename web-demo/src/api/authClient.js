const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

async function request(path, options = {}) {
  const { headers: optHeaders, ...rest } = options;
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...optHeaders },
    ...rest,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data;
}

export function getMe(token) {
  return request("/api/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function patchMe(token, updates) {
  return request("/api/me", {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(updates),
  });
}

export function createSession(token, session) {
  return request("/api/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(session),
  });
}

export function getSessions(token) {
  return request("/api/sessions", {
    headers: { Authorization: `Bearer ${token}` },
  });
}
