.PHONY: install run dev build lint typecheck check clean help

install:
	npm install

run:
	npm run dev

dev: run

build:
	npm run build

lint:
	npm run lint

typecheck:
	npm run typecheck

check: lint typecheck

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
	@echo "  typecheck  Run TypeScript type checker"
	@echo "  check      lint + typecheck"
	@echo "  clean      Delete node_modules"
	@echo ""
