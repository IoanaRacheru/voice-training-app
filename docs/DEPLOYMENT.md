# Deployment and Docker

## 1. Docker Images
### API image (dev)
- File: `api/Dockerfile`
- Multi-stage build with Rust 1.88 builder
- Runtime base: `debian:bookworm-slim`
- Exposes port `3000`

### API image (prod profile)
- File: `api/Dockerfile.prod`
- Release build (`cargo build --release`)
- Runtime base: `debian:bookworm-slim`

### Frontend image
- File: `web-demo/Dockerfile`
- Base: `node:20-alpine3.22`
- Runs Vite dev server (`npm run dev -- --host 0.0.0.0`)

## 2. Compose Service Graph
Defined in `docker-compose.yml`:
- `vosk` (`2700`)
- `mongodb` (healthchecked)
- `postgres` (healthchecked)
- `keycloak` (`8080`, backed by postgres)
- `api` (`3000`)
- optional variants: `api_vosk` (`3001`), `api_vosk_silero` (`3002`)

## 3. Startup and Health
Typical local flow:
1. `make up`
2. `make keycloak-setup`
3. `make verify-stack`

Supplemental checks:
- `make verify-vosk-api`
- `make verify-challenge-chat-api`
- `make verify-e2e-smoke`

## 4. Environment Contract (API)
Important env variables:
- `MONGODB_URI`
- `KEYCLOAK_REALM_URL`
- `KEYCLOAK_EXPECTED_ISSUER`
- `KEYCLOAK_EXPECTED_AUDIENCES`
- `ANALYZE_MAX_BODY_BYTES`
- `LLM_PROVIDER` (+ provider keys/models)
- `ASR_PROVIDER`, `VOSK_SERVER_URL`
- `VAD_PROVIDER`
- `PROVIDER_STRICT`

## 5. Notes
- Current deployment is optimized for local/demo iteration.
- Production hardening requires dedicated reverse proxy/TLS/secret management/image signing.
