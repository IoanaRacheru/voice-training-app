# Worklog

## 2026-05-28

### Completed
- Added `app_core` orchestration engine, tool traits, and baseline heuristic tools.
- Added authenticated `POST /api/analyze` API flow and artifact persistence.
- Added unit tests for engine/tool behavior and request DTO validation.
- Added provider-based LLM adapter support (OpenAI-compatible, OpenRouter, Groq) with rule fallback.
- Added `GET /api/llm/health` endpoint for runtime provider visibility.
- Added repository abstraction for analysis persistence to decouple route tests from Mongo runtime.
- Added integration-style `/api/analyze` route test with in-memory repository.
- Added backend `Makefile` test targets: `test-api`, `test-core`, `test-fast`.
- Added docstrings for public interfaces touched in `app_core` and API config/state/repository layers.
- Added OpenAPI generation and Swagger UI endpoints:
  - `GET /api/openapi.json`
  - `GET /docs`
- Added OpenAPI contract test and `make test-openapi`.
- Added Cargo dependency/security quality gates:
  - `make dep-tree`
  - `make dep-outdated`
  - `make dep-audit`
  - `make dep-deny`
  - `make dep-check`
- Added baseline `deny.toml` and dependency workflow notes in `docs/CARGO_QUALITY.md`.
- Added CI dependency gates workflow for `cargo-audit` and `cargo-deny`.
- Expanded Rust CI workflow to run workspace checks/tests on `main` and `dev-ariimia`.
- Added DSP feature extraction module in `app_core`:
  - frame-based energy VAD/pause ratio
  - autocorrelation pitch estimation
  - FFT-based spectral brightness
- Extended analysis input contract with optional PCM payload (`audio_samples`, `sample_rate`) while preserving backward compatibility for numeric-only clients.
- Integrated DSP-derived metrics into engine pipeline when audio is provided.
- Added DSP robustness metadata:
  - signal confidence score
  - quality flags (low energy, low voiced ratio, insufficient pitch frames, unstable pitch)
  - VAD implementation identifier in analysis output
- Added pluggable VAD interface with `EnergyVadDetector` and `SileroVadDetector` stub adapter hook.
- Added `make test-dsp-bench` and extra DSP regression threshold tests.
- Added lightweight infra reliability improvements for dev bootstrap:
  - `wait-api` target
  - `verify-stack` target (API + Keycloak reachability and config status)
  - `bootstrap` now runs `verify-stack` after Keycloak setup
- Added ASR/pronunciation v1 scaffold in `app_core`:
  - `SpeechRecognizer` trait
  - `PronunciationEvaluator` trait
  - `VoskAsrStub` adapter (contract-preserving placeholder)
  - `SimplePronunciationEvaluator`
- Extended analysis engine and `/api/analyze` response with:
  - `asr` transcript/confidence
  - `pronunciation` feedback against optional `expected_text`
- Extended request contract with optional `expected_text`.

### Next In Queue
- Implement provider-backed LLM adapters (OpenAI-compatible, Groq, OpenRouter).
- Add integration tests around `/api/analyze` behavior.

### Branches
- `feat/roadmap-agent-docs`: roadmap and agent tracking docs.
- `feat/llm-provider-adapters`: provider-backed LLM coach wiring and health endpoint.
- `feat/analyze-integration-tests-make-docs`: analysis repository abstraction, integration tests, Make targets, docstrings.
- `feat/openapi-swagger`: OpenAPI/Swagger wiring and API docs tests.
- `feat/cargo-quality-gates`: Cargo-native dependency and advisory quality gates.
- `feat/ci-dependency-gates`: CI enforcement for dependency security and workspace Rust checks.
- `feat/dsp-tools-v1`: DSP feature extraction and audio-aware analysis pipeline.
- `feat/dsp-robustness-v2`: confidence/quality diagnostics and pluggable VAD contracts.
- `feat/infra-dev-stability`: minimal stack verification/reliability hardening for MVP development.
- `feat/asr-pronunciation-v1`: ASR/pronunciation scaffolding and API integration.
