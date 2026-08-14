import { test, expect } from "@playwright/test";

/* Coverage for the /catalog → /ads merge (2026-08-14, stages 1-3): /catalog is
 * gone as a page (now a redirect), /ads is the whole marketplace list instead
 * of a tile overview, /ads/<slug> is one channel's own filtered list, and an
 * empty channel keeps the old "coming soon" block with no filter rail. Default
 * locale (hy, no cookie set — see playwright.config.ts) matches every other
 * read-only spec in this file's neighbourhood. Read-only throughout: nothing
 * here signs in or writes anything, so it needs no fixture and no teardown. */

test.describe("old /catalog links still resolve", () => {
  test("/catalog redirects to /ads", async ({ page }) => {
    await page.goto("/catalog");
    await expect(page).toHaveURL(/\/ads$/);
  });

  // The exact bookmark shape a shared "/catalog?channel=BILLBOARD" link used
  // to carry — the query string has to survive the redirect, not just the path.
  test("/catalog?channel=BILLBOARD redirects to /ads?channel=BILLBOARD", async ({ page }) => {
    await page.goto("/catalog?channel=BILLBOARD");
    await expect(page).toHaveURL(/\/ads\?channel=BILLBOARD$/);
  });
});

test.describe("header nav", () => {
  test("no standalone Catalog link, Advertising dropdown leads to /ads and to a channel", async ({
    page,
  }) => {
    await page.goto("/ads");

    // The nav item this dropdown replaced pointed straight at /catalog — gone
    // now, not just relabeled.
    await expect(page.locator('nav a[href="/catalog"]')).toHaveCount(0);

    const trigger = page.getByRole("button", { name: "Գովազդ", exact: true });
    await expect(trigger).toBeVisible();
    await trigger.click();

    // First row: "all listings", not a tile-overview link.
    const allListings = page.locator('nav a[href="/ads"]');
    await expect(allListings).toBeVisible();

    // One channel row, picked by href rather than its translated label so this
    // doesn't care which channel it is.
    const channelLink = page.locator('nav a[href="/ads/placement"]');
    await expect(channelLink).toBeVisible();
    await channelLink.click();
    await expect(page).toHaveURL(/\/ads\/placement$/);
  });
});

test.describe("/ads — the general list", () => {
  test("shows both projects and ad spaces, with a channel facet", async ({ page }) => {
    await page.goto("/ads");

    // Channel facet only makes sense on the unfiltered list — a channel page
    // already IS one channel (see the next describe block).
    await expect(page.getByRole("button", { name: "Ալիք", exact: true })).toBeVisible();

    // A result count renders and isn't stuck at zero.
    const summary = page.getByText(/^Ցուցադրված է/);
    await expect(summary).toBeVisible();
    const digits = (await summary.innerText()).match(/\d+/g);
    expect(digits, "no number in the results summary").not.toBeNull();
    expect(digits!.reduce((sum, n) => sum + Number(n), 0)).toBeGreaterThan(0);

    // Both row kinds present at once — a project card links to /reports/<id>,
    // an ad-space card to /ads/<channel-slug>/<code> (three path segments,
    // vs. a channel nav link's two).
    await expect(page.locator('a[href^="/reports/"]').first()).toBeVisible();
    const hasAdSpaceCard = await page.evaluate(
      () =>
        Array.from(document.querySelectorAll('a[href^="/ads/"]')).filter(
          (a) => new URL((a as HTMLAnchorElement).href).pathname.split("/").filter(Boolean).length === 3,
        ).length > 0,
    );
    expect(hasAdSpaceCard, "no ad-space card rendered on /ads — check the local seed has one").toBe(true);
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

    // Every row already belongs to this channel — the Channel checkbox would
    // be one redundant box, so facets.ts hides it here.
    await expect(page.getByRole("button", { name: "Ալիք", exact: true })).toHaveCount(0);

    // But the filter rail itself is there, with at least one facet on it
    // (genre, at minimum — every project has one).
    const filterButtons = page.locator("aside button");
    await expect(filterButtons.first()).toBeVisible();
    expect(await filterButtons.count()).toBeGreaterThan(0);
  });

  // RADIO has no listings in the seed this repo ships with (checked against a
  // local run — VIDEO/RADIO/TV/BANNER/TRANSIT are all empty). If a future
  // seed populates it, swap in whichever channel is actually empty rather
  // than forcing this one.
  test("radio: empty channel shows the coming-soon block, no filter rail", async ({ page }) => {
    await page.goto("/ads/radio");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("Գույքագրումը կհայտնվի ավելի ուշ")).toBeVisible();
    await expect(page.getByRole("link", { name: "Գրել մեզ" })).toBeVisible();

    await expect(page.locator("aside")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "ՖԻԼՏՐՆԵՐ", exact: true })).toHaveCount(0);
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
  test("picking a genre, opening a project, then going Back keeps it checked", async ({ page }) => {
    await page.goto("/ads");

    const firstCheckbox = genreCheckboxes(page).first();
    await firstCheckbox.check();
    await expect(firstCheckbox).toBeChecked();

    // Genre only ever matches a project row, so this is guaranteed to still
    // be a /reports/ link once the filter narrows the list.
    const firstReport = page.locator('a[href^="/reports/"]').first();
    await expect(firstReport).toBeVisible();
    await firstReport.click();
    await expect(page).toHaveURL(/\/reports\/\d+/);

    await page.goBack();
    await expect(page).toHaveURL(/\/ads/);
    await expect(genreCheckboxes(page).first()).toBeChecked();
  });
});

test.describe("a filtered link opens the same way in a fresh session", () => {
  test("?genre=<value> restores the filter with no prior sessionStorage", async ({ page, context }) => {
    // Derive a real genre value from the live facet rather than guessing one
    // — the address bar mirrors the selection (see ads-view.tsx's
    // replaceState effect), so picking a box and reading the URL back is the
    // one way to get a token that's actually in the local seed.
    await page.goto("/ads");
    await genreCheckboxes(page).first().check();
    await page.waitForFunction(() => new URL(location.href).searchParams.has("genre"));
    const query = new URL(page.url()).search;
    expect(query).toContain("genre=");

    // A brand-new visit with no session history — same old-shape query param
    // name ("genre", unchanged since before the facets.ts rewrite) is what a
    // link shared months ago would still carry.
    await context.clearCookies();
    await page.evaluate(() => sessionStorage.clear());
    await page.goto(`/ads${query}`);

    await expect(genreCheckboxes(page).first()).toBeChecked();
  });
});

test.describe("mobile filter sheet (375px)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("opens from the bottom, closes, and locks the page behind it", async ({ page }) => {
    await page.goto("/ads");

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
