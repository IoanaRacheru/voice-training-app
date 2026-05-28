# ASR and VAD Runtime Notes

## Purpose
- Keep default development flow lightweight (`ASR_PROVIDER=stub`, `VAD_PROVIDER=energy`).
- Allow opt-in runtime validation for real adapters.

## Environment Variables
- `ASR_PROVIDER=stub|vosk`
- `VOSK_MODEL_PATH=/absolute/path/to/vosk-model` (required when `ASR_PROVIDER=vosk`)
- `VAD_PROVIDER=energy|silero`

## Local Validation
- Compile-check real Vosk integration:
  - `make check-vosk`
- Regular test suite:
  - `cargo test -p app_core -p api`

## Docker Build Validation
- Build API image with Vosk feature enabled:
  - `make build-api-image-vosk`

## Notes
- Vosk runtime requires a valid local model directory at `VOSK_MODEL_PATH`.
- If Vosk feature is not enabled at compile time, API falls back to stub ASR.
- Silero VAD adapter is wired and selected with `VAD_PROVIDER=silero`; if model/session initialization fails at runtime, extraction falls back to energy VAD.
