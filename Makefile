.PHONY: all setup up down build logs restart clean dev \
        install-frontend run-frontend lint-frontend check-frontend clean-frontend \
        keycloak-setup keycloak-status help

# ── All-in-one ───────────────────────────────────────────────────────────────

all: setup up keycloak-setup dev

# ── Onboarding ──────────────────────────────────────────────────────────────

setup:
	@if [ ! -f .env ]; then cp .env.example .env && echo "Created .env from .env.example — fill in secrets before continuing."; else echo ".env already exists, skipping."; fi
	@if [ -f web-demo/.env.example ] && [ ! -f web-demo/.env ]; then cp web-demo/.env.example web-demo/.env && echo "Created web-demo/.env from web-demo/.env.example."; elif [ ! -f web-demo/.env.example ]; then echo "web-demo/.env.example not found, skipping web-demo .env copy."; else echo "web-demo/.env already exists, skipping."; fi
	$(MAKE) -C web-demo install

# ── Docker ───────────────────────────────────────────────────────────────────

up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose up -d --build api

logs:
	docker compose logs -f

restart:
	docker compose restart

clean:
	docker compose down -v

# ── Development ──────────────────────────────────────────────────────────────

dev: up
	$(MAKE) -C web-demo dev

# ── Frontend (delegated) ─────────────────────────────────────────────────────

install-frontend:
	$(MAKE) -C web-demo install

run-frontend:
	$(MAKE) -C web-demo run

lint-frontend:
	$(MAKE) -C web-demo lint

check-frontend:
	$(MAKE) -C web-demo check

clean-frontend:
	$(MAKE) -C web-demo clean

# ── Keycloak (delegated) ─────────────────────────────────────────────────────

keycloak-setup:
	$(MAKE) -C keycloak all

keycloak-status:
	$(MAKE) -C keycloak status

# ── Help ─────────────────────────────────────────────────────────────────────

help:
	@echo ""
	@echo "Usage: make <target>"
	@echo ""
	@echo "All-in-one"
	@echo "  all               setup → up → keycloak-setup → dev"
	@echo ""
	@echo "Onboarding"
	@echo "  setup             Copy .env files and install frontend deps"
	@echo "  keycloak-setup    Configure Keycloak via Admin API (realm, client, settings, theme)"
	@echo "  keycloak-status   Print current Keycloak realm configuration"
	@echo ""
	@echo "Docker"
	@echo "  up                Start all services (detached)"
	@echo "  down              Stop all services"
	@echo "  build             Rebuild and restart the API container"
	@echo "  logs              Stream logs from all containers"
	@echo "  restart           Restart all containers"
	@echo "  clean             Stop all containers and delete volumes"
	@echo ""
	@echo "Development"
	@echo "  dev               Start Docker stack then launch the frontend dev server"
	@echo ""
	@echo "Frontend (delegated to web-demo/Makefile)"
	@echo "  install-frontend  npm install in web-demo/"
	@echo "  run-frontend      npm run dev in web-demo/"
	@echo "  lint-frontend     npm run lint in web-demo/"
	@echo "  check-frontend    lint + typecheck in web-demo/"
	@echo "  clean-frontend    Remove web-demo/node_modules"
	@echo ""
	@echo "Run 'make -C keycloak help' for granular Keycloak targets."
	@echo ""
