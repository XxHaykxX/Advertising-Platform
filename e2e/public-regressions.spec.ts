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

    // /ads itself only redirects since the 2026-08-18 restructure; sponsorship
    // is the group with project rows.
    await page.goto("/ads/sponsorship");
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

      // The other half of the same rule — every locale gets the same page, not
      // a thinner one. This used to assert the two trust figures ("100%",
      // "50+"); that section was removed from the home page on 2026-08-18, so
      // pinning its copy would only pin one owner's wording of the week.
      // Structure is what has to match: four ways to advertise, and the form
      // that closes the page. Copy stays free to change in /admin/i18n without
      // turning this red.
      await expect(page.locator("#ad-types a[href^='/ads/']")).toHaveCount(4);
      await expect(page.locator("#callback form")).toBeVisible();
    });
  }
});

test.describe("mobile menu (375px)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  // Reported by the owner, 19.08: the menu opened, looked right, and swallowed
  // every tap on its own links — only the close button (which sits in the
  // header bar, above the scrim) responded. The scrim is `fixed`, so it painted
  // over the static panel whatever the DOM order said.
  //
  // 🔴 `locator.click()` does NOT catch this and passed against the broken
  // build: Playwright resolves the target itself and delivers the event there,
  // so a link buried under a full-screen overlay still "clicks". Only a raw
  // page.mouse.click() at the coordinates goes through the browser's own hit
  // testing the way a finger does. Any future test of "is this thing actually
  // tappable" has to use the mouse, not the locator.
  test("a tap on a menu link navigates instead of hitting the scrim", async ({ page }) => {
    await page.goto("/");

    // The only visible aria-expanded control at this width — the desktop
    // dropdown's trigger is inside a `hidden lg:flex` nav. Not matched by
    // label: every string here comes from the dictionary and moves.
    await page.locator("header button[aria-expanded]:visible").click();

    const about = page.locator("header a[href='/about']:visible");
    await expect(about).toBeVisible();
    // The panel expands over 250ms (framer, mobile-nav-panel.tsx) and the link
    // slides down with it — coordinates read mid-animation land wherever the
    // link used to be. `locator.click()` waits for that on its own; a raw mouse
    // click is the price of testing the browser's real hit testing.
    await page.waitForTimeout(500);
    const box = await about.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);

    await expect(page).toHaveURL(/\/about$/);
  });

  test("the scrim still closes the menu when tapped outside it", async ({ page }) => {
    await page.goto("/");
    const toggle = page.locator("header button[aria-expanded]:visible");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");

    // Bottom of the viewport: below the panel, on the scrim itself.
    await page.mouse.click(187, 780);
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});

test.describe("404", () => {
  test("an unknown address keeps the site chrome and offers a way back", async ({ page }) => {
    const res = await page.goto("/definitely-not-a-page-2026");
    expect(res?.status()).toBe(404);

    // Next's built-in 404 has none of this: no header, no footer, no links.
    await expect(page.getByRole("link", { name: "iGovazd" }).first()).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // "browse projects" points at the sponsorship group (the one that sells
    // projects), not the redirect-only /ads (see not-found.tsx).
    await expect(page.locator('a[href="/ads/sponsorship"]').first()).toBeVisible();
  });
});
