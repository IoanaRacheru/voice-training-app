# Agent Workflow Guide

## Branch Policy
- Use one branch per feature or bugfix.
- Branch naming:
  - `feat/<short-topic>`
  - `fix/<short-topic>`
  - `chore/<short-topic>`
- Merge back to `dev-ariimia` using non-fast-forward merge commits.

## Required Process
1. Create feature branch from `dev-ariimia`.
2. Implement scoped changes only for that branch.
3. Run tests relevant to changed modules, then broader workspace checks.
4. Commit with GPG signing using repository user identity.
5. Merge to `dev-ariimia` and update `docs/WORKLOG.md`.

## Scope Boundaries
- `app_core`:
  - Pure orchestration and tool interfaces.
  - No HTTP or storage client code.
- `api`:
  - Request validation, auth, persistence, wiring.
  - Adapters into `app_core`.
- Clients:
  - Consume backend output and render feedback.
  - No core analysis logic duplication.

## Test Policy
- Every bugfix requires a regression test added first or in same patch.
- New endpoint behavior requires request-contract tests.
- Avoid merging branches with failing tests.

## Dependency Policy
- Run `make dep-check` before merging dependency-related changes.
- Keep `deny.toml` policy updates explicit and documented.
- Prefer Cargo-native tooling (`cargo tree`, `cargo audit`, `cargo deny`, `cargo outdated`) over ad-hoc scripts.

## Active Backlog
- [x] Provider-backed LLM coach adapters.
- [x] `/api/analyze` integration tests.
- [x] DSP tool replacement for heuristics.
- [ ] PostgreSQL repository integration.
- [x] ASR/pronunciation tool adapters.
