import { test, expect, type Page } from "@playwright/test";
import { STAFF_EMAIL, STAFF_PASSWORD, CREATOR_EMAIL, CREATOR_PASSWORD } from "./global-setup";
import { AD_GROUP_SLUGS, type AdChannelGroup } from "../src/lib/ad-channels";
import { MEMBER_SESSION_COOKIE } from "../src/lib/auth/session";

/* Pre-cutover smoke suite for the AWS migration — point it at any environment
 * and it answers "is this deployment actually usable", so it can be run
 * against the new host before DNS is switched:
 *
 *   E2E_BASE_URL=https://<aws-host> npx playwright test e2e/smoke.spec.ts
 *
 * Each test targets one thing an environment swap (new host, a load balancer
 * in front, new env vars) can break silently, that uploads.spec.ts's
 * storage-driver focus doesn't cover: role routing after sign-in, the session
 * cookie's flags, a guarded route landing on a login page rather than a 500.
 *
 * Does NOT touch /admin/i18n — its "Save & publish" commits to main and
 * deploys the live site (see AGENTS.md), and does not send mail or register a
 * push subscription.
 */

async function signInMember(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.getByRole("button", { name: "Մուտք", exact: true }).click();
}

async function signInStaff(page: Page) {
  await page.goto("/admin/login");
  await page.fill('input[name="email"]', STAFF_EMAIL);
  await page.fill('input[name="password"]', STAFF_PASSWORD);
  await page.locator('button[type="submit"]').click();
}

test.describe("health", () => {
  test("GET /api/health answers 200 without touching auth or the DB", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    // Plain text "ok", not JSON — see the route: it deliberately skips Prisma
    // so an RDS hiccup can't turn every ECS task's health check red at once.
    expect(await res.text()).toBe("ok");
    expect(res.headers()["content-type"]).toMatch(/^text\/plain/);
  });
});

test.describe("sign-in, role routing", () => {
  test("a creator signs in and lands under /account", async ({ page }) => {
    await signInMember(page, CREATOR_EMAIL, CREATOR_PASSWORD);
    await page.waitForURL((u) => u.pathname === "/account", { timeout: 20000 });
    await expect(page).toHaveURL(/\/account$/);
  });

  test("a brand signs in and is redirected to /account/brand, the buyer cabinet", async ({
    page,
  }) => {
    // Reuses the brand@test.com fixture — same account signin-return.spec.ts
    // and profile-save.spec.ts sign in as, see global-setup.ts.
    await signInMember(page, "brand@test.com", "brand1234");
    // This redirect is role-driven (proxy.ts): a wrong DATABASE_URL, or a role
    // column that migrated wrong, lands a brand in the creator cabinet
    // instead and this is the assertion that would catch it.
    await page.waitForURL((u) => u.pathname === "/account/brand", { timeout: 20000 });
    await expect(page).toHaveURL(/\/account\/brand$/);
  });

  test("staff signs in at /admin/login and reaches /admin", async ({ page }) => {
    await signInStaff(page);
    await page.waitForURL((u) => u.pathname === "/admin", { timeout: 20000 });
    await expect(page).toHaveURL(/\/admin$/);
  });
});

test.describe("session cookie", () => {
  test("the member cookie is httpOnly, and secure whenever the base URL is https", async ({
    page,
    context,
    baseURL,
  }) => {
    await signInMember(page, CREATOR_EMAIL, CREATOR_PASSWORD);
    await page.waitForURL((u) => u.pathname === "/account", { timeout: 20000 });
    const cookies = await context.cookies();
    const session = cookies.find((c) => c.name === MEMBER_SESSION_COOKIE);
    expect(session, `no ${MEMBER_SESSION_COOKIE} cookie after sign-in`).toBeTruthy();
    expect(session!.httpOnly).toBe(true);
    // Behind a load balancer the app sees plain HTTP from the proxy — that is
    // exactly the condition under which sessionCookieOptions() can silently
    // stop marking the cookie secure, so only assert it where the outside
    // world actually sees https (local dev runs on http:// on purpose).
    if (baseURL?.startsWith("https:")) {
      expect(session!.secure).toBe(true);
    }
  });
});

test.describe("public pages render", () => {
  // Hy labels straight from i18n.ts — a distinctive string per group, so a
  // page rendering the wrong group's content (or falling through to a 404)
  // fails here instead of only "looking empty" in a screenshot.
  const GROUP_LABEL_HY: Record<AdChannelGroup, string> = {
    OUTDOOR: "Արտաքին գովազդ",
    DIGITAL: "Թվային գովազդ",
    MEDIA: "Հեռարձակում և սթրիմինգ",
    SPONSORSHIP: "Հովանավորություն և product placement",
  };

  for (const [group, slug] of Object.entries(AD_GROUP_SLUGS) as [AdChannelGroup, string][]) {
    test(`/ads/${slug} (${group}) renders its own group`, async ({ page }) => {
      const res = await page.goto(`/ads/${slug}`);
      expect(res?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(GROUP_LABEL_HY[group]);
    });
  }

  test("the home page renders", async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.status()).toBe(200);
    await expect(page.getByText("ԲԱՑԱՀԱՅՏԵ՛Ք ՆՈՐ ՀՆԱՐԱՎՈՐՈՒԹՅՈՒՆՆԵՐ")).toBeVisible();
    // Structure over copy for the rest, same reasoning as
    // public-regressions.spec.ts: the four ways to advertise and the closing
    // form, free to reword without turning this red.
    await expect(page.locator("#ad-types a[href^='/ads/']")).toHaveCount(4);
    await expect(page.locator("#callback form")).toBeVisible();
  });
});

test.describe("staff-only surfaces load (no send, no publish)", () => {
  // Load-only on purpose: /admin/i18n's "Опубликовать" commits src/lib/i18n.ts
  // to main and deploys the live site, and /admin/broadcast's composer sends
  // real email/push. Neither button is touched here — see AGENTS.md.
  test("the i18n editor loads for staff", async ({ page }) => {
    await signInStaff(page);
    await page.waitForURL((u) => u.pathname === "/admin", { timeout: 20000 });
    const res = await page.goto("/admin/i18n");
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Переводы интерфейса");
  });

  test("the broadcast composer (email + push) loads for staff", async ({ page }) => {
    await signInStaff(page);
    await page.waitForURL((u) => u.pathname === "/admin", { timeout: 20000 });
    const res = await page.goto("/admin/broadcast");
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Рассылка");
  });
});

test.describe("gates", () => {
  test("a signed-out visitor is bounced from /account to a login page, not a 500", async ({
    page,
  }) => {
    const res = await page.goto("/account");
    expect(res?.status()).toBe(200);
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });

  test("a signed-out visitor is bounced from /admin to a login page, not a 500", async ({
    page,
  }) => {
    const res = await page.goto("/admin");
    expect(res?.status()).toBe(200);
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });
});
