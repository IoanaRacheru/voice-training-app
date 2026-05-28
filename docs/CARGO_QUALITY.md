# Cargo Quality Gates

## Purpose
- Keep dependency graph understandable.
- Catch known security advisories early.
- Enforce a repeatable deny-policy baseline across agents.

## Make Targets
- `make dep-tree`
  - Prints full workspace dependency tree.
- `make dep-outdated`
  - Lists outdated crates.
  - Requires `cargo-outdated`.
- `make dep-audit`
  - Runs RustSec advisory checks.
  - Requires `cargo-audit`.
- `make dep-deny`
  - Runs deny policy checks from `deny.toml`.
  - Requires `cargo-deny`.
- `make dep-check`
  - Runs `dep-tree`, `dep-audit`, and `dep-deny`.

## Tool Install
- `cargo install cargo-outdated`
- `cargo install cargo-audit`
- `cargo install cargo-deny`

## Policy File
- `deny.toml` is the canonical baseline policy for this repository.
- Keep policy updates in dedicated commits with rationale in `docs/WORKLOG.md`.
