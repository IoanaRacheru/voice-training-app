.PHONY: setup up down build logs restart clean dev \
        install-frontend run-frontend lint-frontend check-frontend clean-frontend \
        keycloak-setup help

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

# ── Keycloak manual setup ────────────────────────────────────────────────────

keycloak-setup:
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "  Keycloak manual setup (run after: make up)"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@echo "1. Open http://localhost:8080 and log in with:"
	@echo "   User: admin"
	@echo "   Password: value of KEYCLOAK_ADMIN_PASSWORD in your .env (default: admin)"
	@echo ""
	@echo "2. Create a new Realm:"
	@echo "   Left sidebar → Create Realm"
	@echo "   Name: voice-training   → Create"
	@echo ""
	@echo "3. Create a Client:"
	@echo "   Clients → Create client"
	@echo "   Client ID:          voice-training-app"
	@echo "   Client type:        OpenID Connect   → Next"
	@echo "   Client authentication: OFF (public client)"
	@echo "   Standard flow:      ON   → Next"
	@echo "   Valid redirect URIs: http://localhost:5173/*"
	@echo "   Web origins:         http://localhost:5173"
	@echo "   → Save"
	@echo ""
	@echo "4. Enable user registration:"
	@echo "   Realm settings → Login tab"
	@echo "   User registration:  ON"
	@echo "   Forgot password:    ON"
	@echo "   → Save"
	@echo ""
	@echo "5. Use email as username:"
	@echo "   Realm settings → Login tab"
	@echo "   Email as username:  ON"
	@echo "   → Save"
	@echo ""
	@echo "6. Apply the custom theme:"
	@echo "   Realm settings → Themes tab"
	@echo "   Login theme: voice-training"
	@echo "   → Save"
	@echo ""
	@echo "7. Copy the realm URL into your .env:"
	@echo "   KEYCLOAK_REALM_URL=http://localhost:8080/realms/voice-training"
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "  Done. Run 'make dev' to start the full stack."
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""

# ── Help ─────────────────────────────────────────────────────────────────────

help:
	@echo ""
	@echo "Usage: make <target>"
	@echo ""
	@echo "Onboarding"
	@echo "  setup            Copy .env files and install frontend deps"
	@echo "  keycloak-setup   Print step-by-step Keycloak configuration guide"
	@echo ""
	@echo "Docker"
	@echo "  up               Start all services (detached)"
	@echo "  down             Stop all services"
	@echo "  build            Rebuild and restart the API container"
	@echo "  logs             Stream logs from all containers"
	@echo "  restart          Restart all containers"
	@echo "  clean            Stop all containers and delete volumes"
	@echo ""
	@echo "Development"
	@echo "  dev              Start Docker stack then launch the frontend dev server"
	@echo ""
	@echo "Frontend (delegated to web-demo/Makefile)"
	@echo "  install-frontend  npm install in web-demo/"
	@echo "  run-frontend      npm run dev in web-demo/"
	@echo "  lint-frontend     npm run lint in web-demo/"
	@echo "  check-frontend    lint + typecheck in web-demo/"
	@echo "  clean-frontend    Remove web-demo/node_modules"
	@echo ""
