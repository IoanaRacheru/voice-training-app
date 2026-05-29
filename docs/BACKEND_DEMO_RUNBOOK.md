# Backend Demo Runbook

## Preconditions
- Docker daemon is running.
- `.env` is present and valid for local stack.
- Branch and commit are fixed for presentation.

## Startup Sequence
1. `make up`
2. `make keycloak-setup`
3. `make verify-stack`

## Verification Sequence
1. `make verify-vosk-api`
2. `make verify-api-prod`
3. Optional: `make verify-vosk-silero-api`

## Expected Success Signals
- `GET /health` returns `{"status":"ok","service":"voice-training-api"}`.
- `/api/analyze` verification outputs include:
  - `"asr":{...}`
  - `"vad_used":"energy_vad"`
- Production smoke check reports: `Production-profile API verification passed.`

## Fast Failure Triage
- API startup/panic:
  - `docker compose logs --tail=200 api api_vosk api_vosk_silero`
- Vosk path issues:
  - `docker compose logs --tail=200 vosk`
- Auth/token smoke issues:
  - `docker compose logs --tail=200 keycloak`

## Degraded Presentation Fallback
- If Vosk runtime is unstable, keep backend online with strict config and present deterministic analysis plus authenticated profile/session/artifact flows.
- If Silero path is unstable in the demo environment, document degraded mode explicitly and run the fallback profile with clear disclosure of `vad_used` behavior.
- If `verify-vosk-silero-api` fails with ORT linker symbols (`__isoc23_*`), treat Silero Docker path as unavailable on current host toolchain and continue with stable energy-VAD profile for presentation.
