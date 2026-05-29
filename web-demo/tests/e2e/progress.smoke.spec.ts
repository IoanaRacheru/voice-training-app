import { expect, test } from "@playwright/test";
import { ensureLoggedIn } from "./helpers/auth";

test("progress page renders backend-connected state", async ({ page }) => {
  await ensureLoggedIn(page);
  await page.goto("/progress");
  await expect(page.getByTestId("page-progress")).toBeVisible();

  const emptyState = page.getByTestId("progress-empty-state");
  const dataState = page.getByTestId("progress-data-state");

  if (await emptyState.isVisible()) {
    await expect(emptyState).toContainText("No sessions yet");
  } else {
    await expect(dataState).toBeVisible();
  }
});
