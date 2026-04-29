.PHONY: install-frontend run-frontend lint-frontend check-frontend dev

install-frontend:
	$(MAKE) -C web-demo install

run-frontend:
	$(MAKE) -C web-demo run

lint-frontend:
	$(MAKE) -C web-demo lint

check-frontend:
	$(MAKE) -C web-demo check

dev:
	$(MAKE) -C web-demo dev