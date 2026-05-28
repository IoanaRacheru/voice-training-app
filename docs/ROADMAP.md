# Voice Training App Roadmap

## Current Baseline
- Rust `app_core` engine with pluggable tool interfaces.
- Rust API with authenticated profile/session flows.
- Authenticated `POST /api/analyze` endpoint using `app_core`.
- MongoDB persistence for session and analysis artifacts.

## Milestone M1: LLM Provider Adapters
- Add provider-agnostic LLM client in `app_core`.
- Support OpenAI-compatible base URL + explicit Groq/OpenRouter constructors.
- Add environment-driven provider selection in API bootstrap.
- Keep deterministic fallback to rule-based coach when LLM is disabled.

## Milestone M2: API Integration Testing
- Add authenticated route integration tests for `/api/analyze`.
- Validate request contract and error responses for malformed payloads.
- Add repository-level tests for analysis artifact shape mapping.

## Milestone M3: Real DSP Tooling
- Replace heuristic analysis with real tools behind current traits:
  - VAD (Silero + fallback).
  - F0/pitch tracking and stability metrics.
  - Spectral metrics (brightness/tilt).
- Keep `Engine` orchestration unchanged while swapping implementations.

## Milestone M4: Data Split Formalization
- Keep MongoDB for analytics artifacts.
- Introduce PostgreSQL-backed repositories for canonical entities.
- Add migration scripts and integration tests per repository boundary.

## Milestone M5: ASR + Pronunciation
- Add Vosk-backed ASR adapter.
- Add pronunciation/rhythm feedback using transcript + timing alignment.
- Extend session summary with pronunciation cues.

## Definition Of Done (Per Feature)
- Unit tests for new modules and edge cases.
- Integration tests for public API behavior changes.
- Changelog update in `docs/WORKLOG.md`.
- GPG-signed commit on a dedicated feature branch.
