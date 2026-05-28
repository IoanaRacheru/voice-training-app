.PHONY: all bootstrap setup setup-env install up down start stop build-api-image rebuild-api-image logs logs-api logs-keycloak logs-db \
        ps status health restart clean clean-data clean-all prune docker-check \
        dev dev-frontend dev-stack \
        install-frontend run-frontend lint-frontend typecheck-frontend check-frontend build-frontend clean-frontend \
        check-backend build-backend test-backend \
        check build test fmt \
        keycloak-setup keycloak-status wait-keycloak \
        doctor debug-env debug-keycloak debug-api help

SHELL := /bin/sh
DOCKER_COMPOSE ?= docker compose

# ── All-in-one ───────────────────────────────────────────────────────────────

all: bootstrap dev

bootstrap: setup up wait-keycloak keycloak-setup

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

down: docker-check
	$(DOCKER_COMPOSE) down

start: up

stop: down

build-api-image: docker-check
	$(DOCKER_COMPOSE) up -d --build api

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
	@echo "Keycloak realm endpoint:" && curl -sf http://localhost:8081/realms/master > /dev/null && echo "ok" || echo "unreachable"

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

dev-frontend:
	$(MAKE) run-frontend

dev-stack: up wait-keycloak keycloak-setup

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

# ── Automation (CI-like local) ───────────────────────────────────────────────

check: check-backend check-frontend

build: build-backend build-frontend

test: test-backend

fmt:
	cargo fmt --all

# ── Keycloak (delegated) ─────────────────────────────────────────────────────

wait-keycloak:
	@echo "Waiting for Keycloak to be ready..."
	@until curl -sf http://localhost:8081/realms/master > /dev/null 2>&1; do \
	  printf '.'; \
	  sleep 3; \
	done
	@echo " ready."

keycloak-setup:
	$(MAKE) -C keycloak all

keycloak-status:
	$(MAKE) -C keycloak status

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
	@echo "  dev-stack         start stack + wait + Keycloak setup (no frontend)"
	@echo "  dev-frontend      run only frontend dev server"
	@echo ""
	@echo "Docker"
	@echo "  up/down           start/stop stack"
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
