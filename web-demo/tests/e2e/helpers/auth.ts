import { expect, Page } from "@playwright/test";

const USERNAME = process.env.PLAYWRIGHT_DEV_USER ?? "devuser@local.dev";
const PASSWORD = process.env.PLAYWRIGHT_DEV_PASS ?? "devpass123";
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173";


export async function ensureLoggedIn(page: Page): Promise<void> {
  await page.goto("/profile");
  const profileView = page.getByTestId("page-profile");
  const keycloakLogin = page.getByRole("heading", { name: "Welcome back" });

  const profileReady = await profileView.isVisible().catch(() => false);
  if (!profileReady) {
    await keycloakLogin.waitFor({ state: "visible", timeout: 15_000 });
    await page.getByLabel("Email").fill(USERNAME);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
  }

  await page.waitForURL(`${BASE_URL}/profile`, { timeout: 30_000 });
  await expect(profileView).toBeVisible({ timeout: 15_000 });
}
