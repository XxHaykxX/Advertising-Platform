import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));

// Integration tests — REQUIRE the local docker MySQL to be up (see AGENTS.md /
// local-dev). Run with `npm run test:int`. Kept out of the default `npm test`
// so unit tests stay DB-free and CI-safe.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(root, "src"),
      "server-only": path.resolve(root, "test/empty.ts"),
    },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.integration.test.ts"],
    setupFiles: ["test/load-env.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
    fileParallelism: false, // shared DB rows — run integration files serially
  },
});
