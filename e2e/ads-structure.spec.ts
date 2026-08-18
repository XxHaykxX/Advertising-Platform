import { test, expect } from "@playwright/test";

/* Coverage for the four-groups-not-five restructure (2026-08-18): /ads is a
 * redirect again (no everything-at-once list), /ads/<group-slug> is a group's
 * combined inventory across its channels (with a Channel facet as a
 * switcher), /ads/<channel-slug> is what it always was — one channel's own
 * filtered list. Default locale (hy, no cookie set — see playwright.config.ts)
 * matches every other read-only spec in this file's neighbourhood. Read-only
 * throughout: nothing here signs in or writes anything, so it needs no
 * fixture and no teardown.
 *
 * SPONSORSHIP (placement, events — both PROJECT-backed) and OUTDOOR
 * (billboard, lifts, transit — all AD_SPACE-backed) are used as the two
 * "has data" groups below because they're the only ones where every member
 * channel carries local seed data (checked against a local run,
 * 2026-08-18) — no single group mixes PROJECT and AD_SPACE channels
 * (SPONSORSHIP sells projects, the other three sell ad spaces), so unlike the
 * old /ads list a group page can no longer show both row kinds at once.
 *
 * The old "radio: empty channel shows the coming-soon block" case is gone
 * without a replacement: prisma/seed-ad-spaces.mts (2026-08-17) gave every
 * AD_SPACE channel one listing, so there is no longer a naturally empty
 * channel or group in the local seed to exercise that state against. */

test.describe("old bookmarks still resolve", () => {
  test("/catalog with no channel goes to the homepage type cards", async ({ page }) => {
    await page.goto("/catalog");
    await expect(page).toHaveURL(/\/#ad-types$/);
  });

  // The exact bookmark shape a shared "/catalog?channel=BILLBOARD" link used
  // to carry — it now lands on the channel page directly, not on /ads first.
  test("/catalog?channel=BILLBOARD redirects straight to /ads/billboard", async ({ page }) => {
    await page.goto("/catalog?channel=BILLBOARD");
    await expect(page).toHaveURL(/\/ads\/billboard$/);
  });

  test("/ads with no channel goes to the homepage type cards", async ({ page }) => {
    await page.goto("/ads");
    await expect(page).toHaveURL(/\/#ad-types$/);
  });

  test("/ads?channel=BILLBOARD redirects to /ads/billboard", async ({ page }) => {
    await page.goto("/ads?channel=BILLBOARD");
    await expect(page).toHaveURL(/\/ads\/billboard$/);
  });
});

test.describe("header nav", () => {
  test("no standalone Catalog link, Advertising dropdown is two levels (group, then channel)", async ({
    page,
  }) => {
    await page.goto("/ads/sponsorship");

    // The nav item this dropdown replaced pointed straight at /catalog — gone
    // now, not just relabeled.
    await expect(page.locator('nav a[href="/catalog"]')).toHaveCount(0);

    const trigger = page.getByRole("button", { name: "Գովազդ", exact: true });
    await expect(trigger).toBeVisible();
    await trigger.click();

    // Group heading is a link (a group lists all of its channels' inventory
    // at once) — not just a caption above the channel rows.
    const groupLink = page.locator('nav a[href="/ads/sponsorship"]');
    await expect(groupLink).toBeVisible();

    // One channel row, picked by href rather than its translated label so
    // this doesn't care which channel it is.
    const channelLink = page.locator('nav a[href="/ads/placement"]');
    await expect(channelLink).toBeVisible();
    await channelLink.click();
    await expect(page).toHaveURL(/\/ads\/placement$/);
  });
});

test.describe("/ads/<group> — a group's combined list", () => {
  test("sponsorship: project rows from both its channels, channel facet as a switcher", async ({
    page,
  }) => {
    await page.goto("/ads/sponsorship");

    // The channel switcher only makes sense once a page spans more than one
    // channel (a single-channel page's rows already all belong to it — see
    // the channel-page block below), and it's chips above the results, not a
    // checkbox facet in the sidebar (that copy was dropped once the chips
    // could drive the same selection — see ads-view.tsx's renderableFacets).
    await expect(page.getByRole("button", { name: "Բոլորը", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Փրոդաքթ փլեյսմենթ", exact: true })).toBeVisible();

    const summary = page.getByText(/^Ցուցադրված է/);
    await expect(summary).toBeVisible();
    const digits = (await summary.innerText()).match(/\d+/g);
    expect(digits, "no number in the results summary").not.toBeNull();
    expect(digits!.reduce((sum, n) => sum + Number(n), 0)).toBeGreaterThan(0);

    // PLACEMENT and EVENTS are both PROJECT-backed — every row here links to
    // a report, never to an ad-space card.
    await expect(page.locator('a[href^="/reports/"]').first()).toBeVisible();
  });

  test("outdoor: ad-space rows from all three of its channels", async ({ page }) => {
    await page.goto("/ads/outdoor");

    // Three channels → the chip switcher shows all three plus "All".
    await expect(page.locator("button[aria-pressed]")).toHaveCount(4);
    await expect(page.getByRole("button", { name: "Բիլբորդներ", exact: true })).toBeVisible();

    // Billboard, lifts and transit are all AD_SPACE-backed — an ad-space card
    // links to /ads/<channel-slug>/<code> (three path segments, vs. a channel
    // nav link's two).
    const hasAdSpaceCard = await page.evaluate(
      () =>
        Array.from(document.querySelectorAll('a[href^="/ads/"]')).filter(
          (a) => new URL((a as HTMLAnchorElement).href).pathname.split("/").filter(Boolean).length === 3,
        ).length > 0,
    );
    expect(hasAdSpaceCard, "no ad-space card rendered on /ads/outdoor — check the local seed").toBe(true);
  });
});

test.describe("/ads/<channel> — one channel's own list", () => {
  // PLACEMENT has rows in every local seed this repo ships with (it's the
  // platform's original product); pick it by slug, not by counting anything.
  test("placement: no marketing copy, no channel facet, has this channel's own facets", async ({
    page,
  }) => {
    await page.goto("/ads/placement");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // The "What this is" / "What you can buy" sections dropped in stage 4 —
    // their dictionary keys are gone, so this also guards against anyone
    // hand-writing the copy back in as a literal.
    const body = await page.locator("body").innerText();
    expect(body).not.toContain("Ի՞նչ է սա");
    expect(body).not.toContain("Ի՞նչ կարելի է գնել");

    // Every row already belongs to this channel — the chip switcher only
    // renders once a page spans more than one (see ads-view.tsx).
    await expect(page.locator("button[aria-pressed]")).toHaveCount(0);

    // But the filter rail itself is there, with at least one facet on it
    // (genre, at minimum — every project has one).
    const filterButtons = page.locator("aside button");
    await expect(filterButtons.first()).toBeVisible();
    expect(await filterButtons.count()).toBeGreaterThan(0);
  });
});

test.describe("PageHero back link", () => {
  test("a channel page steps up to its group", async ({ page }) => {
    await page.goto("/ads/placement");
    // The footer's own "sponsorship" link carries the same group label — scope
    // to the hero section so this only matches the secondary CTA.
    const back = page
      .locator("section")
      .getByRole("link", { name: "Հովանավորություն և product placement" });
    await expect(back).toBeVisible();
    await back.click();
    await expect(page).toHaveURL(/\/ads\/sponsorship$/);
  });

  test("a group page steps out to the homepage type cards", async ({ page }) => {
    await page.goto("/ads/sponsorship");
    const back = page.locator("section").getByRole("link", { name: "Գովազդի բոլոր տեսակները" });
    await expect(back).toBeVisible();
    await back.click();
    await expect(page).toHaveURL(/\/#ad-types$/);
  });
});

// The options list is CheckboxFilter's adjacent sibling right after its own
// header button (ads-view.tsx) — an adjacent-sibling CSS selector reaches it
// directly, no parent-locator gymnastics needed. :text-is() is Playwright's
// exact-match text engine, so this can't accidentally hit a button whose
// label merely contains "Ժանր".
const genreCheckboxes = (page: import("@playwright/test").Page) =>
  page.locator('button:text-is("Ժանր") + div input[type="checkbox"]');

test.describe("filters survive Back (IA-24)", () => {
  // Genre only ever matches a PROJECT row, so this needs a page with project
  // inventory — the sponsorship group, not an ad-space-only one.
  test("picking a genre, opening a project, then going Back keeps it checked", async ({ page }) => {
    await page.goto("/ads/sponsorship");

    const firstCheckbox = genreCheckboxes(page).first();
    await firstCheckbox.check();
    await expect(firstCheckbox).toBeChecked();

    const firstReport = page.locator('a[href^="/reports/"]').first();
    await expect(firstReport).toBeVisible();
    await firstReport.click();
    await expect(page).toHaveURL(/\/reports\/\d+/);

    await page.goBack();
    await expect(page).toHaveURL(/\/ads\/sponsorship/);
    await expect(genreCheckboxes(page).first()).toBeChecked();
  });
});

test.describe("a filtered link opens the same way in a fresh session", () => {
  test("?genre=<value> restores the filter with no prior sessionStorage", async ({ page, context }) => {
    // Derive a real genre value from the live facet rather than guessing one
    // — the address bar mirrors the selection (see ads-view.tsx's
    // replaceState effect), so picking a box and reading the URL back is the
    // one way to get a token that's actually in the local seed.
    await page.goto("/ads/sponsorship");
    await genreCheckboxes(page).first().check();
    await page.waitForFunction(() => new URL(location.href).searchParams.has("genre"));
    const query = new URL(page.url()).search;
    expect(query).toContain("genre=");

    // A brand-new visit with no session history — same old-shape query param
    // name ("genre", unchanged since before the facets.ts rewrite) is what a
    // link shared months ago would still carry.
    await context.clearCookies();
    await page.evaluate(() => sessionStorage.clear());
    await page.goto(`/ads/sponsorship${query}`);

    await expect(genreCheckboxes(page).first()).toBeChecked();
  });
});

test.describe("mobile filter sheet (375px)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("opens from the bottom, closes, and locks the page behind it", async ({ page }) => {
    await page.goto("/ads/sponsorship");

    // The always-visible desktop sidebar is gone at this width; the mobile
    // trigger takes its place.
    await expect(page.locator("aside")).toBeHidden();
    const trigger = page.getByRole("button", { name: "ՖԻԼՏՐՆԵՐ", exact: true });
    await expect(trigger).toBeVisible();
    await trigger.click();

    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();

    // Bottom sheet, not a full-screen takeover: anchored to the bottom edge
    // and shorter than the viewport.
    const box = (await sheet.locator("> div").nth(1).boundingBox())!;
    expect(box.y + box.height).toBeGreaterThan(800); // reaches the bottom edge
    expect(box.height).toBeLessThan(812); // but doesn't cover the whole screen

    const overflowWhileOpen = await page.evaluate(() => getComputedStyle(document.body).overflow);
    expect(overflowWhileOpen).toBe("hidden");

    await page.getByRole("button", { name: "Փակել ընտրացանկը", exact: true }).click();
    await expect(sheet).toBeHidden();
    const overflowAfterClose = await page.evaluate(() => getComputedStyle(document.body).overflow);
    expect(overflowAfterClose).not.toBe("hidden");
  });
});
