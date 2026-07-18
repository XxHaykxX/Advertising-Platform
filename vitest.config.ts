import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      // Match the tsconfig `@/*` -> `src/*` path alias.
      "@": path.resolve(root, "src"),
      // `server-only` throws if imported outside a server component; stub it so
      // pure helpers in server-only modules stay unit-testable.
      "server-only": path.resolve(root, "test/empty.ts"),
    },
  },
  test: {
    // Unit/integration tests run in Node (no DOM needed for data-layer logic).
    environment: "node",
    globals: true,
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    // Playwright specs live under e2e/ and use their own runner — keep them out.
    // Integration tests need the docker DB — run via `npm run test:int`.
    exclude: ["e2e/**", "node_modules/**", ".next/**", "**/*.integration.test.ts"],
  },
});
