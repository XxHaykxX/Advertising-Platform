import { test, expect } from "@playwright/test";

/* Regressions from the 2026-08-14 QA pass on production.
 *
 * Both bugs were invisible on screen — the project page looked right, and
 * nobody types a wrong URL while testing a happy path — which is exactly why
 * they survived until someone read the <head> and pasted a link into a chat. */

test.describe("project page metadata", () => {
  test("a project carries its own title, canonical and OG tags — not the home page's", async ({
    page,
  }) => {
    await page.goto("/");
    const homeTitle = await page.title();

    await page.goto("/ads");
    const firstReport = page.locator('a[href^="/reports/"]').first();
    await expect(firstReport).toBeVisible();
    const href = await firstReport.getAttribute("href");
    await firstReport.click();
    await expect(page).toHaveURL(/\/reports\/\d+/);

    // The h1 is the project's name; the tab must say the same thing, not
    // "iGovazd — Brand Placement Marketplace" like every other page did.
    const projectName = (await page.getByRole("heading", { level: 1 }).innerText()).trim();
    const title = await page.title();
    expect(title).not.toBe(homeTitle);
    expect(title).toContain(projectName);

    // A canonical of "/" on every project is what made the site look like one
    // page, and og:url is what the chat preview follows.
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical).toContain(href);

    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
    expect(ogTitle).toContain(projectName);
  });
});

test.describe("home page copy per locale", () => {
  // The Armenian home page was rewritten by the owner; ru and en kept the old
  // template, so for months the Russian visitor was told the platform had
  // analysed "100 000+ сценариев" and covered "100+ стран". Nothing on screen
  // looked broken — the numbers were simply someone else's.
  for (const [locale, banned] of [
    ["ru", "100 000+"],
    ["en", "100,000+"],
  ] as const) {
    test(`${locale}: the home page makes no claim the Armenian one doesn't`, async ({
      page,
      context,
    }) => {
      await context.addCookies([
        { name: "locale", value: locale, url: "https://igovazd.am" },
        { name: "locale", value: locale, url: "http://localhost" },
      ]);
      await page.goto("/");
      const body = await page.locator("body").innerText();
      expect(body).not.toContain(banned);
      // hy says "100% secure deal" + "50+ trusted partners"; the other two
      // locales have to say the same thing.
      expect(body).toContain("100%");
      expect(body).toContain("50+");
    });
  }
});

test.describe("404", () => {
  test("an unknown address keeps the site chrome and offers a way back", async ({ page }) => {
    const res = await page.goto("/definitely-not-a-page-2026");
    expect(res?.status()).toBe(404);

    // Next's built-in 404 has none of this: no header, no footer, no links.
    await expect(page.getByRole("link", { name: "iGovazd" }).first()).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator('a[href="/ads"]').first()).toBeVisible();
  });
});
