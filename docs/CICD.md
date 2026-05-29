# CI/CD and Quality Gates

## 1. Current GitHub Actions
### Rust workflow (`.github/workflows/rust.yml`)
Triggers:
- push / PR on `main`, `dev-ariimia`

Steps:
1. checkout
2. setup stable Rust
3. `cargo check --workspace --all-targets`
4. `cargo test --workspace --verbose`

### Dependency Gates (`.github/workflows/dependency-gates.yml`)
Triggers:
- push / PR on `main`, `dev-ariimia`

Steps:
1. checkout
2. setup stable Rust
3. install `cargo-audit`
4. install `cargo-deny`
5. `make dep-tree`
6. `make dep-audit`
7. `make dep-deny`

## 2. What Exists vs Missing
Implemented now:
- Rust compile/test validation
- dependency security/license gates

Not yet implemented in Actions:
- frontend build/test gates
- docker image build/publish pipeline
- deployment stages (staging/prod)
- signed release artifacts and SBOM publishing

## 3. Suggested Incremental Roadmap
1. Add frontend CI job (`npm ci`, unit tests, `npm run build`).
2. Add Docker build smoke for API/frontend images.
3. Add image registry publish on tagged releases.
4. Add environment-based deploy workflows (staging -> production).
5. Add artifact attestation/signing and release metadata.

## 4. Local Verification Parity
Useful local pre-push commands:
- `cargo check --workspace --all-targets`
- `cargo test --workspace`
- `make dep-audit`
- `make dep-deny`
- `npm --prefix web-demo run test -- --runInBand`
- `npm --prefix web-demo run build`
