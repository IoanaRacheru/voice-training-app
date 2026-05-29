import { expect, test } from "@playwright/test";
import { ensureLoggedIn } from "./helpers/auth";

test("challenge route loads and starts daily route", async ({ page }) => {
  await ensureLoggedIn(page);
  await page.goto("/challenge");
  await expect(page.getByTestId("page-challenge")).toBeVisible();

  const setup = page.getByTestId("challenge-setup");
  if (await setup.isVisible()) {
    await page.getByTestId("challenge-generate-button").click();
  }

  const startRouteButton = page.getByTestId("challenge-start-route-button");
  if (await startRouteButton.isVisible()) {
    await startRouteButton.click();
  }

  await expect(page.getByTestId("challenge-route")).toBeVisible();
  await expect(page.getByTestId("challenge-progress")).toContainText("/");
});
