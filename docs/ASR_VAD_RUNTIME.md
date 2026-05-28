# ASR and VAD Runtime Notes

## Purpose
- Keep default development flow production-like with Dockerized Vosk (`ASR_PROVIDER=vosk_remote`, `VAD_PROVIDER=energy`).
- Allow runtime validation for real adapters without local model installs.

## Environment Variables
- `ASR_PROVIDER=stub|vosk_remote`
- `VOSK_SERVER_URL=ws://vosk:2700` (required when `ASR_PROVIDER=vosk_remote`)
- `VAD_PROVIDER=energy|silero`
- `PROVIDER_STRICT=true|false` (default `true`)

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
- In strict mode (`PROVIDER_STRICT=true`), configured providers are fail-fast:
  - `ASR_PROVIDER=vosk_remote` requires `VOSK_SERVER_URL`.
  - `VAD_PROVIDER=silero` requires API build with feature `vad_silero`.
- In non-strict mode (`PROVIDER_STRICT=false`), provider initialization failures fall back:
  - ASR falls back to stub ASR.
  - VAD falls back to energy VAD.
