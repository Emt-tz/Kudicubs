import { defineConfig, devices } from "@playwright/test";

/**
 * Runs the website specs against an already running dev server (no build, no global sign-in):
 *   NEXT_DIST_DIR=.next-site npx next dev -p 3201
 *   SITE_URL=http://127.0.0.1:3201 npx playwright test -c playwright.site.config.ts
 */
export default defineConfig({
  testDir: "./tests",
  testMatch: /site\.spec\.ts/,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  retries: 0,
  fullyParallel: false,
  reporter: [["list"]],
  use: { baseURL: process.env.SITE_URL ?? "http://127.0.0.1:3201", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
