# Dependencies and Runtime Matrix

## 1. Core Backend (Rust)
Key categories (see `api/Cargo.toml` and `app_core/Cargo.toml`):
- HTTP/API: `axum`, `tower-http`, `utoipa`
- Async runtime: `tokio`
- Serialization: `serde`, `serde_json`
- Persistence: `mongodb`
- Auth/JWT: `jsonwebtoken`, `reqwest` (JWKS fetch)
- Observability: `tracing`, `tracing-subscriber`
- Error handling: `thiserror`

## 2. Frontend Runtime
- React + Vite app (`web-demo`)
- Auth: `keycloak-js`
- Testing: Node test runner + Playwright (smoke E2E)

## 3. External Services
- `MongoDB` (app data)
- `PostgreSQL` (Keycloak DB)
- `Keycloak` (OIDC auth)
- `Vosk` websocket server (ASR provider path)

## 4. Provider/Feature Matrix
### ASR
- `stub`: deterministic/no external ASR dependency
- `vosk_remote`: requires `VOSK_SERVER_URL`

### VAD
- `energy`: default deterministic VAD
- `silero`: requires feature `vad_silero` and host/runtime compatibility

### LLM
- `rule`: deterministic fallback
- `openai` / `openrouter` / `groq`: API-key backed providers

## 5. Operational Notes
- `PROVIDER_STRICT=true` makes provider misconfiguration fail-fast.
- In non-strict mode, backend may degrade to fallback implementations.
