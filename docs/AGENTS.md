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

## Active Backlog
- [ ] Provider-backed LLM coach adapters.
- [ ] `/api/analyze` integration tests.
- [ ] DSP tool replacement for heuristics.
- [ ] PostgreSQL repository integration.
- [ ] ASR/pronunciation tool adapters.
