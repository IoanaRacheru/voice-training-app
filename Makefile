.PHONY: install-frontend run-frontend lint-frontend check-frontend clean-frontend dev clean

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

dev:
	$(MAKE) -C web-demo dev

clean: clean-frontend
