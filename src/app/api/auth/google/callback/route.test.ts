import { describe, it, expect, vi } from "vitest";

/* The Google routes used to build their origin with `new URL(req.url).origin`,
   the same construction IA-31 hit in api/auth/signout: behind Passenger — and
   behind the load balancer this app is moving to — req.url carries the
   container's own bind address, not the host the browser typed. On the signout
   route that produced an unreachable Location; here it would also be sent to
   Google as the redirect_uri, where a mismatch fails every sign-in.

   So the invariant under test is: no response Location may ever carry an
   origin, however broken the request's own origin is. */

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined, delete: () => {}, set: () => {} }),
}));

const { GET } = await import("./route");

describe("GET /api/auth/google/callback", () => {
  it("bounces to a root-relative /login when the CSRF state is missing", async () => {
    const res = await GET(new Request("https://igovazd.am/api/auth/google/callback?code=x&state=y"));
    expect(res.status).toBe(307);
    expect(res.headers.get("Location")).toBe("/login?error=google");
  });

  it("keeps the Location relative even when req.url carries the internal bind address", async () => {
    // The exact production condition: the proxy hands the route a request whose
    // own URL's origin is reachable only from inside the network.
    const res = await GET(new Request("http://10.0.1.23:3000/api/auth/google/callback?code=x&state=y"));
    const location = res.headers.get("Location");
    expect(location).toBe("/login?error=google");
    expect(location?.startsWith("http")).toBe(false);
  });
});
