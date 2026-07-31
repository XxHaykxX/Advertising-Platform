import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import path from "node:path";

// Regression guard for the split-out client i18n bundle (task #18): fails if
// a "use client" file starts using a t()/localizeValue() key that isn't in
// the checked-in src/lib/i18n-client-keys.ts, which would silently render as
// a raw key in the browser (clientDict() in i18n.ts only ships keys from that
// list). Run `npm run i18n:keys` and commit the result to fix.
describe("i18n-client-keys.ts — up to date with client-file usage", () => {
  it("matches a fresh scan of every \"use client\" file", () => {
    const root = path.resolve(__dirname, "..", "..");
    expect(() =>
      execFileSync("node", ["scripts/gen-i18n-client-keys.mjs", "--check"], {
        cwd: root,
        stdio: "pipe",
      }),
    ).not.toThrow();
  });
});
