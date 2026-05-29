import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173";
const apiURL = process.env.PLAYWRIGHT_API_URL ?? "http://localhost:3000";
const keycloakURL = process.env.PLAYWRIGHT_KEYCLOAK_URL ?? "http://localhost:8080";
const keycloakRealm = process.env.PLAYWRIGHT_KEYCLOAK_REALM ?? "voice-training";
const keycloakClientId = process.env.PLAYWRIGHT_KEYCLOAK_CLIENT_ID ?? "voice-training-app";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 5173",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    env: {
      ...process.env,
      VITE_API_URL: apiURL,
      VITE_KEYCLOAK_URL: keycloakURL,
      VITE_KEYCLOAK_REALM: keycloakRealm,
      VITE_KEYCLOAK_CLIENT_ID: keycloakClientId,
    },
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
});
