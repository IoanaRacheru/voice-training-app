# ASR and VAD Runtime Notes

## Purpose
- Keep default development flow production-like with Dockerized Vosk and stable energy VAD (`ASR_PROVIDER=vosk_remote`, `VAD_PROVIDER=energy`).
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
- API `vad_silero` feature maps directly to `app_core/vad_silero`, so Silero runtime is active when enabled in API build features.
- Current Dockerized default verification profile uses `energy` VAD due ORT linker incompatibility in some glibc/toolchain combinations.
- In strict mode (`PROVIDER_STRICT=true`), configured providers are fail-fast:
  - `ASR_PROVIDER=vosk_remote` requires `VOSK_SERVER_URL`.
  - `VAD_PROVIDER=silero` requires API build with feature `vad_silero`.
- In non-strict mode (`PROVIDER_STRICT=false`), provider initialization failures fall back:
  - ASR falls back to stub ASR.
  - VAD falls back to energy VAD.

## Data Retention Warning
- `analysis_artifacts` entries are automatically deleted by MongoDB TTL after 90 days.
- This is destructive retention, not soft-delete, and deleted artifacts are not recoverable from application APIs.

## Retention Window Changes
- If you need to change the 90-day window, update the TTL index definition in API DB init and re-apply indexes.
- Operationally safe approach:
  - pause traffic-sensitive maintenance windows if required by deployment policy;
  - apply updated index settings;
  - verify index value with `db.analysis_artifacts.getIndexes()` before reopening normal traffic.
