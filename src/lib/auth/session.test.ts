import { describe, it, expect, beforeAll } from "vitest";
import {
  createSessionToken,
  verifySessionToken,
  sessionCookieOptions,
} from "./session";

beforeAll(() => {
  // secret() reads SESSION_SECRET lazily at call time, so setting it here is enough.
  process.env.SESSION_SECRET = "test-secret-at-least-16-chars-long";
});

describe("session token round-trip", () => {
  it("signs a token that verifies back to the same uid + role", async () => {
    const token = await createSessionToken(42, "CREATOR");
    const payload = await verifySessionToken(token);
    expect(payload).toEqual({ uid: 42, role: "CREATOR" });
  });

  it("returns null for a missing token", async () => {
    expect(await verifySessionToken(undefined)).toBeNull();
    expect(await verifySessionToken(null)).toBeNull();
    expect(await verifySessionToken("")).toBeNull();
  });

  it("returns null for a tampered / garbage token", async () => {
    const token = await createSessionToken(1, "BRAND");
    expect(await verifySessionToken(token + "x")).toBeNull();
    expect(await verifySessionToken("not.a.jwt")).toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await createSessionToken(1, "SUPERADMIN");
    process.env.SESSION_SECRET = "a-completely-different-secret-value";
    expect(await verifySessionToken(token)).toBeNull();
    process.env.SESSION_SECRET = "test-secret-at-least-16-chars-long";
  });

  it("rejects an already-expired token", async () => {
    const token = await createSessionToken(7, "CREATOR", -10); // expired 10s ago
    expect(await verifySessionToken(token)).toBeNull();
  });

  it("throws if SESSION_SECRET is too short", async () => {
    const saved = process.env.SESSION_SECRET;
    process.env.SESSION_SECRET = "short";
    await expect(createSessionToken(1, "BRAND")).rejects.toThrow(/SESSION_SECRET/);
    process.env.SESSION_SECRET = saved;
  });
});

describe("sessionCookieOptions", () => {
  it("is httpOnly, lax, root-path, and persists by default (no arg)", () => {
    const o = sessionCookieOptions();
    expect(o.httpOnly).toBe(true);
    expect(o.sameSite).toBe("lax");
    expect(o.path).toBe("/");
    expect(o.maxAge).toBe(60 * 60 * 24 * 7); // default 7 days when no arg
  });

  it("omits maxAge when passed an explicit undefined (session cookie)", () => {
    // Regression: admin "remember me" unchecked passes undefined and must get a
    // session cookie — a default param would have wrongly persisted it 7 days.
    expect("maxAge" in sessionCookieOptions(undefined)).toBe(false);
  });

  it("includes maxAge when given", () => {
    expect(sessionCookieOptions(3600).maxAge).toBe(3600);
  });
});
