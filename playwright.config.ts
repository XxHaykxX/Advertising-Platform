import { defineConfig, devices } from "@playwright/test";

// E2E smoke suite. Assumes the dev server is already running on :3001
// (`npm run dev`). Run with `npm run test:e2e`.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // shared DB state — keep specs sequential
  workers: 1,
  retries: 0,
  reporter: "list",
  globalTeardown: "./e2e/global-teardown.ts",
  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
    locale: "hy-AM",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
