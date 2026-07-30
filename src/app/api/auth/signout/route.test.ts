import { describe, it, expect } from "vitest";
import { GET } from "./route";
import { SESSION_COOKIE } from "@/lib/auth/session";

/* Regression test for IA-31: NextResponse.redirect(new URL(target, url.origin))
   derived its origin from req.url, which on Hostinger/Passenger reports the
   app's internal bind address (0.0.0.0:3000) instead of the public host. The
   fix emits a bare, root-relative Location instead — so the request's own
   origin must never leak into it, no matter how broken that origin is. */

describe("GET /api/auth/signout", () => {
  it("redirects to /login with no ?to=", async () => {
    const res = await GET(new Request("http://localhost:3001/api/auth/signout"));
    expect(res.status).toBe(307);
    expect(res.headers.get("Location")).toBe("/login");
  });

  it("redirects to /admin/login for ?to=staff", async () => {
    const res = await GET(new Request("http://localhost:3001/api/auth/signout?to=staff"));
    expect(res.status).toBe(307);
    expect(res.headers.get("Location")).toBe("/admin/login");
  });

  it("falls back to /login for a junk ?to= value", async () => {
    const res = await GET(new Request("http://localhost:3001/api/auth/signout?to=whatever"));
    expect(res.status).toBe(307);
    expect(res.headers.get("Location")).toBe("/login");
  });

  it("never emits an absolute Location, even when req.url carries the internal 0.0.0.0 origin", async () => {
    // This is the exact production condition: Passenger hands the route a
    // request whose own URL's origin is unreachable from the browser.
    const res = await GET(new Request("http://0.0.0.0:3000/api/auth/signout"));
    const location = res.headers.get("Location");
    expect(location).toBe("/login");
    expect(location?.startsWith("http")).toBe(false);
  });

  it("clears the session cookie", async () => {
    const res = await GET(new Request("http://localhost:3001/api/auth/signout"));
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain(SESSION_COOKIE);
    expect(setCookie).toContain("Max-Age=0");
  });
});
