import { describe, expect, it } from "vitest";
import { isStaleChunkError } from "./use-stale-chunk-reload";

/** The boundary reloads the whole document on a true match, so a false
 *  positive turns any ordinary render crash into a reload loop — worth
 *  pinning both directions. */
describe("isStaleChunkError", () => {
  it("matches webpack's own error name", () => {
    const e = new Error("Loading chunk 4821 failed.");
    e.name = "ChunkLoadError";
    expect(isStaleChunkError(e)).toBe(true);
  });

  it("matches the message-only phrasings", () => {
    for (const message of [
      "Loading chunk 4821 failed. (missing: /_next/static/chunks/4821.js)",
      "Loading CSS chunk 12 failed.",
      "Failed to fetch dynamically imported module: /_next/static/chunks/x.js",
      "Importing a module script failed.",
    ]) {
      expect(isStaleChunkError(new Error(message)), message).toBe(true);
    }
  });

  it("leaves ordinary errors to the normal boundary UI", () => {
    for (const message of [
      "Cannot read properties of undefined (reading 'map')",
      "Failed to fetch",
      "An error occurred in the Server Components render.",
    ]) {
      expect(isStaleChunkError(new Error(message)), message).toBe(false);
    }
  });
});
