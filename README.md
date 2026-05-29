# Voice Training App

A voice training application [in development] for guided vocal exercises and voice refinement.

> [!IMPORTANT]
> This project is in its early stages of development and is not yet functional. Core features are still under active development.

# Getting started

> Prerequisites: [Docker](https://docs.docker.com/get-docker/) and [Node.js 20+](https://nodejs.org/) must be installed.

```bash
# 1. Clone the repository
git clone <repo-url>
cd voice-training-app

# 2. Copy environment files and install frontend dependencies
make setup
#    → Edit .env and fill in any secrets before the next step.

# 3. Start the full Docker stack (MongoDB, PostgreSQL, Keycloak, API)
make up

# 4. Configure Keycloak (one-time, follow the printed instructions)
make keycloak-setup

# 5. Start the frontend dev server (keeps Docker running in the background)
make dev
```

Run `make help` at any time to see all available targets.

# Documentation index
- Architecture: `docs/ARCHITECTURE.md`
- Backend design patterns: `docs/BACKEND_DESIGN.md`
- Dependencies/runtime matrix: `docs/DEPENDENCIES.md`
- Docker/deployment: `docs/DEPLOYMENT.md`
- Edge/network: `docs/EDGE.md`
- CI/CD and quality gates: `docs/CICD.md`
- Backend demo runbook: `docs/BACKEND_DEMO_RUNBOOK.md`
- Runtime provider notes: `docs/ASR_VAD_RUNTIME.md`
- Handoff snapshot: `docs/HANDOFF_2026-05-29.md`

# Roadmap overview
TODO

# License

This project is Free Software.

- The backend server is licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later): https://www.gnu.org/licenses/agpl-3.0.html
- All other components are licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later), unless otherwise stated: https://www.gnu.org/licenses/gpl-3.0.html

If this project does not include the full license texts, you can obtain them from the official GNU website linked above.


# Authors
For a full list of contributors and authors, see `AUTHORS`.
