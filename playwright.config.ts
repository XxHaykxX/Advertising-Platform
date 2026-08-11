import { defineConfig, devices } from "@playwright/test";

// E2E smoke suite. Assumes the dev server is already running on :3001
// (`npm run dev`). Run with `npm run test:e2e`.
//
// E2E_BASE_URL overrides the port: :3001 is regularly held by an unrelated
// project on this machine, and a suite that silently tests somebody else's app
// (it answers 200) is worse than one that won't start. Set it and run the dev
// server wherever it fits: E2E_BASE_URL=http://localhost:3012 npm run test:e2e
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // shared DB state — keep specs sequential
  workers: 1,
  retries: 0,
  reporter: "list",
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3001",
    trace: "on-first-retry",
    locale: "hy-AM",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
