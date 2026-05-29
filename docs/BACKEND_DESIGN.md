# Backend Design Patterns

## Summary
The backend follows a pragmatic layered architecture with trait-based abstractions to keep provider integrations replaceable and testable.

## 1. Layered Architecture
- Transport layer: Axum routes (`api/src/routes/*`)
- Cross-cutting: auth middleware, config, error mapping
- Domain orchestration: `app_core::Engine`
- Data access: repository traits and Mongo adapters

This keeps HTTP concerns separate from analysis logic and persistence details.

## 2. Patterns Used
### Strategy Pattern
Runtime provider selection is strategy-based:
- LLM provider (`rule`, `openai`, `openrouter`, `groq`)
- ASR provider (`stub`, `vosk_remote`)
- VAD provider (`energy`, `silero` feature-gated)

Selection is config-driven and can fail-fast in strict mode.

### Dependency Inversion (SOLID)
Core services depend on trait contracts instead of concrete implementations:
- `LlmCoach`
- `SpeechRecognizer`
- `VadDetector`
- `ProsodyTool`
- `VoicePresentationTool`
- repository traits in `api/src/repositories`

### Adapter Pattern
Infrastructure bindings are adapters:
- Mongo repositories adapt trait contracts to BSON/collections
- HTTP LLM providers adapt OpenAI-compatible APIs
- Keycloak middleware adapts JWT/JWKS verification to request context

### Orchestrator Pattern
`Engine` coordinates DSP/prosody/voice presentation/LLM/ASR/pronunciation in a single analysis pass.

### Failover/Fallback Pattern (KISS)
- Rule-based coach fallback if external LLM is unavailable.
- Provider strictness policy controls whether to fail-fast or degrade.

## 3. SOLID/KISS Notes
- Single Responsibility: route handlers remain thin.
- Open/Closed: new providers can be added behind existing traits.
- Liskov/Interface Segregation: narrow, behavior-specific traits.
- Dependency Inversion: runtime wiring in `main.rs`.
- KISS: deterministic local fallbacks for demo resilience.

## 4. Known Limitations
- Some frontend metrics still include legacy heuristics for old sessions.
- No distributed message bus/event sourcing; request-response model only.
- Edge gateway concerns are mostly externalized (not a dedicated service yet).
