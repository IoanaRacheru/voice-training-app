.PHONY: all bootstrap setup setup-env install up down start stop build-api-image rebuild-api-image logs logs-api logs-keycloak logs-db \
        ps status health restart clean clean-data clean-all prune docker-check \
        pull-images \
        dev dev-fast dev-frontend dev-stack \
        install-frontend run-frontend lint-frontend typecheck-frontend check-frontend build-frontend clean-frontend \
        check-backend build-backend test-backend test-api test-core test-fast test-openapi test-dsp-bench \
        check-vosk test-vosk-runtime build-api-image-vosk build-api-image-vosk-silero \
        dep-tree dep-outdated dep-audit dep-deny dep-check \
        check build test fmt \
        keycloak-setup keycloak-status wait-keycloak wait-api verify-stack verify-vosk-api verify-vosk-silero-api \
        doctor debug-env debug-keycloak debug-api help

SHELL := /bin/sh
DOCKER_COMPOSE ?= docker compose

# ── All-in-one ───────────────────────────────────────────────────────────────

all: bootstrap dev

bootstrap: setup pull-images up wait-keycloak keycloak-setup verify-stack

# ── Onboarding ──────────────────────────────────────────────────────────────

setup: setup-env install-frontend

setup-env:
	@if [ ! -f .env ]; then cp .env.example .env && echo "Created .env from .env.example — fill in secrets before continuing."; else echo ".env already exists, skipping."; fi
	@if [ -f web-demo/.env.example ] && [ ! -f web-demo/.env ]; then cp web-demo/.env.example web-demo/.env && echo "Created web-demo/.env from web-demo/.env.example."; elif [ ! -f web-demo/.env.example ]; then echo "web-demo/.env.example not found, skipping web-demo .env copy."; else echo "web-demo/.env already exists, skipping."; fi

install:
	$(MAKE) setup

# ── Docker ───────────────────────────────────────────────────────────────────

docker-check:
	@docker info > /dev/null 2>&1 || { \
	  echo "Docker daemon is not accessible."; \
	  echo "Start Docker Desktop/daemon and ensure your user can access /var/run/docker.sock."; \
	  echo "On Linux, this often means adding your user to the 'docker' group, then re-login."; \
	  exit 1; \
	}

up: docker-check
	$(DOCKER_COMPOSE) up -d

pull-images: docker-check
	$(DOCKER_COMPOSE) pull mongodb postgres keycloak vosk

down: docker-check
	$(DOCKER_COMPOSE) down

start: up

stop: down

build-api-image: docker-check
	$(DOCKER_COMPOSE) up -d --build api

build-api-image-vosk: docker-check
	$(DOCKER_COMPOSE) build --build-arg API_FEATURES="--features asr_vosk" api

build-api-image-vosk-silero: docker-check
	$(DOCKER_COMPOSE) build --build-arg API_FEATURES="--features asr_vosk vad_silero" api

rebuild-api-image: clean build-api-image

logs: docker-check
	$(DOCKER_COMPOSE) logs -f

logs-api: docker-check
	$(DOCKER_COMPOSE) logs -f api

logs-keycloak: docker-check
	$(DOCKER_COMPOSE) logs -f keycloak

logs-db: docker-check
	$(DOCKER_COMPOSE) logs -f postgres mongodb

ps: docker-check
	$(DOCKER_COMPOSE) ps

status: ps

health: docker-check
	@echo "API health:" && curl -sf http://localhost:3000/health || true
	@echo ""
	@echo "Keycloak realm endpoint:" && curl -sf http://localhost:8080/realms/master > /dev/null && echo "ok" || echo "unreachable"

restart: docker-check
	$(DOCKER_COMPOSE) restart

clean: down

clean-data: docker-check
	$(DOCKER_COMPOSE) down -v

clean-all: clean-data clean-frontend

prune: docker-check
	docker system prune -f

# ── Development ──────────────────────────────────────────────────────────────

dev: up
	$(MAKE) -C web-demo dev

dev-fast: docker-check
	@echo "Starting MVP backend stack (fast path)..."
	@$(DOCKER_COMPOSE) up -d mongodb postgres keycloak vosk api
	@$(MAKE) wait-keycloak
	@$(MAKE) wait-api
	@$(MAKE) -s keycloak-setup || true
	@echo "dev-fast ready: API=http://localhost:3000 Keycloak=http://localhost:8080 Vosk=ws://localhost:2700"

dev-frontend:
	$(MAKE) run-frontend

dev-stack: up wait-keycloak keycloak-setup

wait-api:
	@echo "Waiting for API to be ready..."
	@until curl -sf http://localhost:3000/health > /dev/null 2>&1; do \
	  printf '.'; \
	  sleep 2; \
	done
	@echo " ready."

# ── Frontend (delegated) ─────────────────────────────────────────────────────

install-frontend:
	$(MAKE) -C web-demo install

run-frontend:
	$(MAKE) -C web-demo run

lint-frontend:
	$(MAKE) -C web-demo lint

typecheck-frontend:
	$(MAKE) -C web-demo typecheck

check-frontend:
	$(MAKE) -C web-demo check

build-frontend:
	$(MAKE) -C web-demo build

clean-frontend:
	$(MAKE) -C web-demo clean

# ── Backend (Rust workspace) ────────────────────────────────────────────────

check-backend:
	cargo check --workspace

build-backend:
	cargo build --workspace

test-backend:
	cargo test --workspace

test-api:
	cargo test -p api

test-core:
	cargo test -p app_core

test-fast:
	cargo test -p app_core -p api

test-openapi:
	cargo test -p api openapi -- --nocapture

test-dsp-bench:
	cargo test -p app_core dsp::tests::extract_features_from_sine_wave -- --nocapture
	cargo test -p app_core dsp::tests::bursty_signal_confidence_degrades -- --nocapture

check-vosk:
	cargo check -p app_core --features asr_vosk
	cargo check -p api --features asr_vosk

test-vosk-runtime:
	@test -n "$$VOSK_SERVER_URL" || { \
	  echo "VOSK_SERVER_URL is required. Example:"; \
	  echo "  VOSK_SERVER_URL=ws://localhost:2700 make test-vosk-runtime"; \
	  exit 1; \
	}
	VOSK_SERVER_URL="$$VOSK_SERVER_URL" cargo test -p app_core --features asr_vosk vosk_runtime_smoke -- --nocapture

dep-tree:
	cargo tree --workspace

dep-outdated:
	@cargo outdated --workspace || { \
	  echo "cargo-outdated is not installed. Install with: cargo install cargo-outdated"; \
	  exit 1; \
	}

dep-audit:
	@cargo audit || { \
	  echo "cargo-audit is not installed. Install with: cargo install cargo-audit"; \
	  exit 1; \
	}

dep-deny:
	@cargo deny check || { \
	  echo "cargo-deny is not installed. Install with: cargo install cargo-deny"; \
	  exit 1; \
	}

dep-check: dep-tree dep-audit dep-deny

# ── Automation (CI-like local) ───────────────────────────────────────────────

check: check-backend check-frontend

build: build-backend build-frontend

test: test-backend

fmt:
	cargo fmt --all

# ── Keycloak (delegated) ─────────────────────────────────────────────────────

wait-keycloak:
	@echo "Waiting for Keycloak to be ready..."
	@until curl -sf http://localhost:8080/realms/master > /dev/null 2>&1; do \
	  printf '.'; \
	  sleep 3; \
	done
	@echo " ready."

keycloak-setup:
	$(MAKE) -C keycloak all

keycloak-status:
	$(MAKE) -C keycloak status

verify-stack: docker-check wait-keycloak wait-api
	@echo ""
	@echo "Running stack verification..."
	@echo "1) API health:" && curl -sf http://localhost:3000/health
	@echo ""
	@echo "2) Keycloak realm availability:" && curl -sf http://localhost:8080/realms/voice-training > /dev/null && echo "ok"
	@echo "3) Keycloak client/realm settings status:"
	@$(MAKE) -s -C keycloak status
	@echo "4) Protected route auth smoke (/api/me with service-account token):"
	@token=$$(curl -s -X POST http://localhost:8080/realms/voice-training/protocol/openid-connect/token \
	  -H "Content-Type: application/x-www-form-urlencoded" \
	  -d "grant_type=client_credentials&client_id=voice-training-smoke&client_secret=smoke-secret" \
	  | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4); \
	test -n "$$token" || (echo "failed to fetch user token" && exit 1); \
	curl -sf http://localhost:3000/api/me -H "Authorization: Bearer $$token" > /dev/null && echo "ok"
	@echo ""
	@echo "Stack verification complete."

verify-vosk-api: docker-check
	@echo "Starting stack with Dockerized Vosk..."
	@$(DOCKER_COMPOSE) up -d --build vosk mongodb postgres keycloak api_vosk
	@echo "Waiting for API (http://localhost:3001/health)..."
	@until curl -sf http://localhost:3001/health > /dev/null 2>&1; do printf '.'; sleep 2; done; echo " ready."
	@echo "Requesting service-account token from Keycloak..."
	@token=$$(curl -s -X POST http://localhost:8080/realms/voice-training/protocol/openid-connect/token \
	  -H "Content-Type: application/x-www-form-urlencoded" \
	  -d "grant_type=client_credentials&client_id=voice-training-smoke&client_secret=smoke-secret" \
	  | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4); \
	test -n "$$token" || (echo "failed to fetch service-account token" && exit 1); \
	audio=$$(awk 'BEGIN{for(i=0;i<4096;i++){v=(i%64<32?0.2:-0.2); printf("%s%.3f",(i==0?"":","),v)}}'); \
	resp=$$(curl -sf -X POST http://localhost:3001/api/analyze \
	  -H "Authorization: Bearer $$token" \
	  -H "Content-Type: application/json" \
	  --data "{\"median_pitch_hz\":180.0,\"pitch_stability\":0.7,\"pause_ratio\":0.2,\"spectral_brightness\":0.6,\"sample_rate\":16000,\"audio_samples\":[$$audio]}"); \
	echo "$$resp" | grep -q '"asr":{' || { echo "ASR output missing in analyze response"; echo "$$resp"; exit 1; }; \
	echo "Vosk API verification passed."

verify-vosk-silero-api: docker-check
	@echo "Starting stack with Dockerized Vosk + Silero-enabled API..."
	@$(DOCKER_COMPOSE) up -d --build vosk mongodb postgres keycloak api_vosk_silero
	@echo "Waiting for API (http://localhost:3002/health)..."
	@until curl -sf http://localhost:3002/health > /dev/null 2>&1; do printf '.'; sleep 2; done; echo " ready."
	@echo "Requesting service-account token from Keycloak..."
	@token=$$(curl -s -X POST http://localhost:8080/realms/voice-training/protocol/openid-connect/token \
	  -H "Content-Type: application/x-www-form-urlencoded" \
	  -d "grant_type=client_credentials&client_id=voice-training-smoke&client_secret=smoke-secret" \
	  | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4); \
	test -n "$$token" || (echo "failed to fetch service-account token" && exit 1); \
	audio=$$(awk 'BEGIN{for(i=0;i<4096;i++){v=(i%64<32?0.2:-0.2); printf("%s%.3f",(i==0?"":","),v)}}'); \
	resp=$$(curl -sf -X POST http://localhost:3002/api/analyze \
	  -H "Authorization: Bearer $$token" \
	  -H "Content-Type: application/json" \
	  --data "{\"median_pitch_hz\":180.0,\"pitch_stability\":0.7,\"pause_ratio\":0.2,\"spectral_brightness\":0.6,\"sample_rate\":16000,\"audio_samples\":[$$audio]}"); \
	echo "$$resp" | grep -q '"asr":{' || { echo "ASR output missing in analyze response"; echo "$$resp"; exit 1; }; \
	echo "$$resp" | grep -q '"vad_used":"silero_vad"' || { echo "Silero VAD not used in analyze response"; echo "$$resp"; exit 1; }; \
	echo "Vosk + Silero API verification passed."

# ── Diagnostics / Debug ─────────────────────────────────────────────────────

doctor:
	@echo "== Toolchain =="
	@docker --version || true
	@$(DOCKER_COMPOSE) version || true
	@node --version || true
	@npm --version || true
	@cargo --version || true
	@echo ""
	@echo "== Env files =="
	@[ -f .env ] && echo ".env: present" || echo ".env: missing"
	@[ -f web-demo/.env ] && echo "web-demo/.env: present" || echo "web-demo/.env: missing"
	@echo ""
	@echo "== Docker status =="
	@$(MAKE) -s docker-check && echo "docker: accessible" || true
	@$(DOCKER_COMPOSE) ps || true

debug-env:
	@echo "From .env:"
	@grep -E '^(POSTGRES_DB|POSTGRES_USER|SERVER_PORT|KEYCLOAK_REALM_URL|MONGODB_URI)=' .env || true

debug-keycloak: up wait-keycloak
	$(MAKE) -C keycloak status

debug-api: up
	@echo "API /health response:"
	@curl -si http://localhost:3000/health || true
	@echo ""
	@echo "Recent API logs:"
	@$(DOCKER_COMPOSE) logs --tail=120 api

# ── Help ─────────────────────────────────────────────────────────────────────

help:
	@echo ""
	@echo "Usage: make <target>"
	@echo ""
	@echo "Bootstrap & Dev"
	@echo "  all / bootstrap   setup + containers + Keycloak setup"
	@echo "  dev               start stack then run frontend dev server"
	@echo "  dev-fast          start only MVP backend stack quickly (no heavy verify/build)"
	@echo "  dev-stack         start stack + wait + Keycloak setup (no frontend)"
	@echo "  verify-stack      verify API + Keycloak are configured and reachable"
	@echo "  dev-frontend      run only frontend dev server"
	@echo ""
	@echo "Docker"
	@echo "  up/down           start/stop stack"
	@echo "  pull-images       pull core runtime images (mongo/postgres/keycloak/vosk)"
	@echo "  build-api-image   rebuild and start api Docker image"
	@echo "  rebuild-api-image clean then build api Docker image"
	@echo "  logs              stream all service logs"
	@echo "  logs-api          stream API logs only"
	@echo "  logs-keycloak     stream Keycloak logs only"
	@echo "  logs-db           stream postgres+mongodb logs"
	@echo "  ps/status         show service status"
	@echo "  health            quick local health checks"
	@echo "  clean             stop containers"
	@echo "  clean-data        stop containers and remove volumes"
	@echo "  clean-all         clean-data + remove frontend node_modules"
	@echo "  prune             docker system prune -f"
	@echo ""
	@echo "Quality Automation"
	@echo "  check             cargo check + frontend lint/typecheck"
	@echo "  build             cargo build + frontend production build"
	@echo "  test              cargo test workspace"
	@echo "  test-api          cargo test -p api"
	@echo "  test-core         cargo test -p app_core"
	@echo "  test-fast         cargo test -p app_core -p api"
	@echo "  test-openapi      run OpenAPI-focused tests in api crate"
	@echo "  test-dsp-bench    run DSP threshold/robustness benchmark-style tests"
	@echo "  dep-tree          print cargo dependency tree"
	@echo "  dep-outdated      list outdated Rust dependencies"
	@echo "  dep-audit         run security advisory checks (cargo-audit)"
	@echo "  dep-deny          run deny policy checks (cargo-deny)"
	@echo "  dep-check         run dep-tree + dep-audit + dep-deny"
	@echo "  fmt               cargo fmt --all"
	@echo ""
	@echo "Debug / Agenting"
	@echo "  doctor            environment and tooling diagnostics"
	@echo "  debug-env         print key .env values"
	@echo "  debug-keycloak    run Keycloak status checks"
	@echo "  debug-api         call API health and print recent API logs"
	@echo ""
	@echo "Frontend (delegated)"
	@echo "  install-frontend, run-frontend, lint-frontend, typecheck-frontend"
	@echo "  check-frontend, build-frontend, clean-frontend"
	@echo ""
	@echo "Keycloak (delegated)"
	@echo "  keycloak-setup, keycloak-status"
	@echo "  More: make -C keycloak help"
	@echo ""
