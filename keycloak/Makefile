.PHONY: all realm client settings theme dev-user smoke-client status clean help

# ── Config ───────────────────────────────────────────────────────────────────

KEYCLOAK_URL    ?= $(shell if curl -sf http://localhost:8080/realms/master >/dev/null 2>&1; then echo http://localhost:8080; else echo http://localhost:8081; fi)
ADMIN_USER      ?= admin
REALM           ?= voice-training
CLIENT_ID       ?= voice-training-app
SMOKE_CLIENT_ID ?= voice-training-smoke
SMOKE_SECRET    ?= smoke-secret
FRONTEND_ORIGIN ?= http://localhost:5173
DEV_USER        ?= devuser
DEV_PASS        ?= devpass123

# Pull admin password from root .env, fall back to Keycloak default
ADMIN_PASS := $(shell grep -m1 '^KEYCLOAK_ADMIN_PASSWORD=' ../.env 2>/dev/null | cut -d= -f2- | tr -d '"')
ADMIN_PASS := $(if $(ADMIN_PASS),$(ADMIN_PASS),admin)

# ── Helpers ───────────────────────────────────────────────────────────────────

# Fetches a short-lived admin token and writes it to .token.
# Falls back to the default `admin` password to handle existing DB state
# where KEYCLOAK_ADMIN_PASSWORD in .env no longer matches current credentials.
define fetch_token
	@echo "  → authenticating as $(ADMIN_USER)..."
	@curl -s -X POST "$(KEYCLOAK_URL)/realms/master/protocol/openid-connect/token" \
	  -H "Content-Type: application/x-www-form-urlencoded" \
	  -d "grant_type=password&client_id=admin-cli&username=$(ADMIN_USER)&password=$(ADMIN_PASS)" \
	  | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4 > .token
	@if [ ! -s .token ] && [ "$(ADMIN_PASS)" != "admin" ]; then \
	  curl -s -X POST "$(KEYCLOAK_URL)/realms/master/protocol/openid-connect/token" \
	    -H "Content-Type: application/x-www-form-urlencoded" \
	    -d "grant_type=password&client_id=admin-cli&username=$(ADMIN_USER)&password=admin" \
	    | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4 > .token; \
	  if [ -s .token ]; then \
	    echo "    (fallback auth with default password 'admin' succeeded)"; \
	  fi; \
	fi
	@test -s .token || (echo "ERROR: could not get admin token — check KEYCLOAK_ADMIN_PASSWORD in .env and Keycloak container state." && rm -f .token && exit 1)
endef

# ── Targets ───────────────────────────────────────────────────────────────────

## all: full setup — realm → client → settings → theme
all: realm client settings theme dev-user smoke-client
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "  Keycloak configured successfully."
	@echo ""
	@echo "  Add this to your .env:"
	@echo "  KEYCLOAK_REALM_URL=$(KEYCLOAK_URL)/realms/$(REALM)"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@$(MAKE) clean

## realm: create the voice-training realm
realm:
	@echo "[1/4] Creating realm '$(REALM)'..."
	$(fetch_token)
	@status=$$(curl -s -o /dev/null -w "%{http_code}" -X POST "$(KEYCLOAK_URL)/admin/realms" \
	  -H "Authorization: Bearer $$(cat .token)" \
	  -H "Content-Type: application/json" \
	  -d '{"realm":"$(REALM)","enabled":true,"displayName":"Voice Training"}'); \
	if [ "$$status" = "201" ]; then \
	  echo "      realm created."; \
	elif [ "$$status" = "409" ]; then \
	  echo "      realm already exists, skipping."; \
	else \
	  echo "ERROR: realm creation failed (HTTP $$status)"; \
	  exit 1; \
	fi

## client: create the voice-training-app OIDC client
client:
	@echo "[2/4] Creating client '$(CLIENT_ID)'..."
	$(fetch_token)
	@status=$$(curl -s -o /dev/null -w "%{http_code}" -X POST "$(KEYCLOAK_URL)/admin/realms/$(REALM)/clients" \
	  -H "Authorization: Bearer $$(cat .token)" \
	  -H "Content-Type: application/json" \
	  -d '{ \
	    "clientId":"$(CLIENT_ID)", \
	    "enabled":true, \
	    "publicClient":true, \
	    "standardFlowEnabled":true, \
	    "directAccessGrantsEnabled":true, \
	    "redirectUris":["$(FRONTEND_ORIGIN)/*"], \
	    "webOrigins":["$(FRONTEND_ORIGIN)"], \
	    "attributes":{"post.logout.redirect.uris":"$(FRONTEND_ORIGIN) $(FRONTEND_ORIGIN)/*"} \
	  }'); \
	if [ "$$status" = "201" ]; then \
	  echo "      client created."; \
	elif [ "$$status" = "409" ]; then \
	  echo "      client already exists, updating settings."; \
	  cid=$$(curl -sf "$(KEYCLOAK_URL)/admin/realms/$(REALM)/clients?clientId=$(CLIENT_ID)" \
	    -H "Authorization: Bearer $$(cat .token)" \
	    | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4); \
	  test -n "$$cid" || (echo "ERROR: could not resolve client id for $(CLIENT_ID)" && exit 1); \
	  status2=$$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$(KEYCLOAK_URL)/admin/realms/$(REALM)/clients/$$cid" \
	    -H "Authorization: Bearer $$(cat .token)" \
	    -H "Content-Type: application/json" \
	    -d '{ \
	      "clientId":"$(CLIENT_ID)", \
	      "enabled":true, \
	      "publicClient":true, \
	      "standardFlowEnabled":true, \
	      "directAccessGrantsEnabled":true, \
	      "redirectUris":["$(FRONTEND_ORIGIN)/*"], \
	      "webOrigins":["$(FRONTEND_ORIGIN)"], \
	      "attributes":{"post.logout.redirect.uris":"$(FRONTEND_ORIGIN) $(FRONTEND_ORIGIN)/*"} \
	    }'); \
	  [ "$$status2" = "204" ] || (echo "ERROR: client update failed (HTTP $$status2)" && exit 1); \
	  echo "      client updated."; \
	else \
	  echo "ERROR: client creation failed (HTTP $$status)"; \
	  exit 1; \
	fi

## dev-user: ensure a local development user exists for API smoke checks
dev-user:
	@echo "[5/5] Ensuring dev user '$(DEV_USER)' exists..."
	$(fetch_token)
	@uid=$$(curl -sf "$(KEYCLOAK_URL)/admin/realms/$(REALM)/users?username=$(DEV_USER)" \
	  -H "Authorization: Bearer $$(cat .token)" \
	  | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4); \
	if [ -n "$$uid" ]; then \
	  status_del=$$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$(KEYCLOAK_URL)/admin/realms/$(REALM)/users/$$uid" \
	    -H "Authorization: Bearer $$(cat .token)"); \
	  [ "$$status_del" = "204" ] || (echo "ERROR: dev user delete failed (HTTP $$status_del)" && exit 1); \
	fi; \
	status=$$(curl -s -o /dev/null -w "%{http_code}" -X POST "$(KEYCLOAK_URL)/admin/realms/$(REALM)/users" \
	  -H "Authorization: Bearer $$(cat .token)" \
	  -H "Content-Type: application/json" \
	  -d '{ \
	    "username":"$(DEV_USER)", \
	    "email":"$(DEV_USER)@local.dev", \
	    "enabled":true, \
	    "emailVerified":true, \
	    "requiredActions": [] \
	  }'); \
	[ "$$status" = "201" ] || (echo "ERROR: dev user create failed (HTTP $$status)" && exit 1); \
	uid=$$(curl -sf "$(KEYCLOAK_URL)/admin/realms/$(REALM)/users?username=$(DEV_USER)" \
	  -H "Authorization: Bearer $$(cat .token)" \
	  | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4); \
	test -n "$$uid" || (echo "ERROR: could not resolve dev user id" && exit 1); \
	status2=$$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$(KEYCLOAK_URL)/admin/realms/$(REALM)/users/$$uid/reset-password" \
	  -H "Authorization: Bearer $$(cat .token)" \
	  -H "Content-Type: application/json" \
	  -d '{"type":"password","value":"$(DEV_PASS)","temporary":false}'); \
	[ "$$status2" = "204" ] || (echo "ERROR: dev user password reset failed (HTTP $$status2)" && exit 1); \
	echo "      dev user ready."

## smoke-client: ensure service-account client for auth smoke checks
smoke-client:
	@echo "[6/6] Ensuring smoke client '$(SMOKE_CLIENT_ID)' exists..."
	$(fetch_token)
	@cid=$$(curl -sf "$(KEYCLOAK_URL)/admin/realms/$(REALM)/clients?clientId=$(SMOKE_CLIENT_ID)" \
	  -H "Authorization: Bearer $$(cat .token)" \
	  | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4); \
	if [ -z "$$cid" ]; then \
	  status=$$(curl -s -o /dev/null -w "%{http_code}" -X POST "$(KEYCLOAK_URL)/admin/realms/$(REALM)/clients" \
	    -H "Authorization: Bearer $$(cat .token)" \
	    -H "Content-Type: application/json" \
	    -d '{ \
	      "clientId":"$(SMOKE_CLIENT_ID)", \
	      "enabled":true, \
	      "publicClient":false, \
	      "serviceAccountsEnabled":true, \
	      "standardFlowEnabled":false, \
	      "directAccessGrantsEnabled":false, \
	      "secret":"$(SMOKE_SECRET)" \
	    }'); \
	  [ "$$status" = "201" ] || (echo "ERROR: smoke client create failed (HTTP $$status)" && exit 1); \
	else \
	  status2=$$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$(KEYCLOAK_URL)/admin/realms/$(REALM)/clients/$$cid" \
	    -H "Authorization: Bearer $$(cat .token)" \
	    -H "Content-Type: application/json" \
	    -d '{ \
	      "clientId":"$(SMOKE_CLIENT_ID)", \
	      "enabled":true, \
	      "publicClient":false, \
	      "serviceAccountsEnabled":true, \
	      "standardFlowEnabled":false, \
	      "directAccessGrantsEnabled":false, \
	      "secret":"$(SMOKE_SECRET)" \
	    }'); \
	  [ "$$status2" = "204" ] || (echo "ERROR: smoke client update failed (HTTP $$status2)" && exit 1); \
	fi; \
	echo "      smoke client ready."

## settings: enable registration, forgot-password, email-as-username
settings:
	@echo "[3/4] Configuring realm settings..."
	$(fetch_token)
	@status=$$(curl -s -o .keycloak-settings-response -w "%{http_code}" -X PUT "$(KEYCLOAK_URL)/admin/realms/$(REALM)" \
	  -H "Authorization: Bearer $$(cat .token)" \
	  -H "Content-Type: application/json" \
	  -d '{ \
	    "registrationAllowed":true, \
	    "resetPasswordAllowed":true, \
	    "loginWithEmailAllowed":true, \
	    "registrationEmailAsUsername":true, \
	    "duplicateEmailsAllowed":false \
	  }'); \
	if [ "$$status" = "204" ]; then \
	  echo "      registration, forgot-password, email-as-username enabled."; \
	else \
	  echo "ERROR: realm settings update failed (HTTP $$status)"; \
	  cat .keycloak-settings-response; \
	  rm -f .keycloak-settings-response; \
	  exit 1; \
	fi; \
	rm -f .keycloak-settings-response

## theme: apply the voice-training login theme
theme:
	@echo "[4/4] Applying login theme..."
	$(fetch_token)
	@status=$$(curl -s -o .keycloak-theme-response -w "%{http_code}" -X PUT "$(KEYCLOAK_URL)/admin/realms/$(REALM)" \
	  -H "Authorization: Bearer $$(cat .token)" \
	  -H "Content-Type: application/json" \
	  -d '{"loginTheme":"voice-training"}'); \
	if [ "$$status" = "204" ]; then \
	  echo "      theme applied."; \
	else \
	  echo "ERROR: theme update failed (HTTP $$status)"; \
	  cat .keycloak-theme-response; \
	  rm -f .keycloak-theme-response; \
	  exit 1; \
	fi; \
	rm -f .keycloak-theme-response

## status: show current realm configuration
status:
	@echo "Fetching realm status..."
	$(fetch_token)
	@curl -sf "$(KEYCLOAK_URL)/admin/realms/$(REALM)" \
	  -H "Authorization: Bearer $$(cat .token)" \
	  | grep -o \
	    '"realm":"[^"]*"\|"loginTheme":"[^"]*"\|"registrationAllowed":[a-z]*\|"resetPasswordAllowed":[a-z]*\|"registrationEmailAsUsername":[a-z]*\|"loginWithEmailAllowed":[a-z]*' \
	  | tr '|' '\n'
	@$(MAKE) clean

## clean: delete cached admin token
clean:
	@rm -f .token

# ── Help ─────────────────────────────────────────────────────────────────────

help:
	@echo ""
	@echo "Usage: make -C keycloak <target>"
	@echo ""
	@echo "  all       Full setup: realm → client → settings → theme → dev-user → smoke-client"
	@echo "  realm     Create the '$(REALM)' realm"
	@echo "  client    Create the '$(CLIENT_ID)' OIDC client"
	@echo "  settings  Enable registration / forgot-password / email-as-username"
	@echo "  theme     Apply the voice-training login theme"
	@echo "  dev-user  Ensure local dev user exists and set password"
	@echo "  smoke-client  Ensure service-account client for API auth smoke checks"
	@echo "  status    Print current realm configuration from the API"
	@echo "  clean     Delete the cached admin token (.token)"
	@echo ""
	@echo "Overridable variables (pass as make args or env):"
	@echo "  KEYCLOAK_URL    (default: $(KEYCLOAK_URL))"
	@echo "  FRONTEND_ORIGIN (default: $(FRONTEND_ORIGIN))"
	@echo "  ADMIN_USER      (default: $(ADMIN_USER))"
	@echo "  ADMIN_PASS      (read from ../.env KEYCLOAK_ADMIN_PASSWORD)"
	@echo ""
