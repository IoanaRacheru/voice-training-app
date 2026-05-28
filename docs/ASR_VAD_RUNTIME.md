# ASR and VAD Runtime Notes

## Purpose
- Keep default development flow production-like with Dockerized Vosk (`ASR_PROVIDER=vosk_remote`, `VAD_PROVIDER=energy`).
- Allow runtime validation for real adapters without local model installs.

## Environment Variables
- `ASR_PROVIDER=stub|vosk_remote`
- `VOSK_SERVER_URL=ws://vosk:2700` (required when `ASR_PROVIDER=vosk_remote`)
- `VAD_PROVIDER=energy|silero`

## Local Validation
- Compile-check real Vosk integration:
  - `make check-vosk`
- Runtime smoke-check against running Vosk server:
  - `VOSK_SERVER_URL=ws://localhost:2700 make test-vosk-runtime`
- Regular test suite:
  - `cargo test -p app_core -p api`

## Docker Build Validation
- Build API image with Vosk feature enabled:
  - `make build-api-image-vosk`

## Notes
- Vosk runtime uses the Docker Vosk websocket API, not local model files.
- If Vosk service is unavailable, API falls back to stub ASR unless `ASR_PROVIDER=vosk_remote` is explicitly required by deployment policy.
- Silero VAD adapter is wired and selected with `VAD_PROVIDER=silero`; if model/session initialization fails at runtime, extraction falls back to energy VAD.
