import { expect, test } from "@playwright/test";
import { ensureLoggedIn } from "./helpers/auth";

test("authenticated app shell loads", async ({ page }) => {
  await ensureLoggedIn(page);
  await expect(page.getByTestId("sidebar")).toBeVisible();
  await expect(page.getByTestId("page-profile")).toBeVisible();
});
