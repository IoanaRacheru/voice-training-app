.PHONY: install run dev build lint lint-fix typecheck test check check-all clean help

install:
	npm install

run:
	npm run dev

dev: run

build:
	npm run build

lint:
	npm run lint

lint-fix:
	npm run lint:fix

typecheck:
	npm run typecheck

test:
	npm run test

check: lint typecheck test

check-all: check build

clean:
	node -e "require('fs').rmSync('node_modules', { recursive: true, force: true })"

help:
	@echo ""
	@echo "Usage: make <target>"
	@echo ""
	@echo "  install    Install npm dependencies"
	@echo "  dev        Start the Vite dev server"
	@echo "  build      Production build"
	@echo "  lint       Run ESLint"
	@echo "  lint-fix   Run ESLint with auto-fix"
	@echo "  typecheck  Run TypeScript type checker"
	@echo "  test       Run unit tests"
	@echo "  check      lint + typecheck + test"
	@echo "  check-all  check + production build"
	@echo "  clean      Delete node_modules"
	@echo ""
