import { expect, test } from "@playwright/test";
import { ensureLoggedIn } from "./helpers/auth";

test("chatbot sends a message and gets a reply", async ({ page }) => {
  await ensureLoggedIn(page);
  await page.goto("/chatbot");
  await expect(page.getByTestId("page-chatbot")).toBeVisible();

  const initialMessages = page.getByTestId("chat-message");
  const initialCount = await initialMessages.count();
  await page.getByTestId("chat-input").fill("Need a short breathing drill.");
  await page.getByTestId("chat-send-button").click();

  await expect(page.getByTestId("chat-message")).toHaveCount(initialCount + 2, { timeout: 20_000 });
  await expect(page.getByTestId("chat-message").last()).toBeVisible();
});
