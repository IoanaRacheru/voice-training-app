.PHONY: install run dev lint typecheck check clean

install:
	npm install

run:
	npm run dev

dev: run

lint:
	npm run lint

typecheck:
	npm run typecheck

check: lint typecheck

clean:
	node -e "require('fs').rmSync('node_modules', { recursive: true, force: true })"
