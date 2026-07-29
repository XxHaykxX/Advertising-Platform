import { test, expect } from "@playwright/test";

// Read-only guest smoke — exercises the public catalog, the catalog Format /
// Country filters fixed this batch, and a card → report navigation. Asserts no
// uncaught page errors (broken poster images are 404s, not page errors, so they
// don't fail this).
test.describe("guest — public catalog", () => {
  test("catalog renders, filters present, card opens a report, no page errors", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (e) => pageErrors.push(e.message));

    await page.goto("/catalog");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Format filter (V2) exists. The parenthesised-country rule it used to
    // check here ("Diaspora (US, France)" must not split on the inner comma)
    // depended on one seeded project and went vacuous when the local dataset
    // changed — it lives in src/lib/data/split-countries.test.ts now.
    await expect(page.getByRole("button", { name: "Ձևաչափ" })).toBeVisible();

    const firstReport = page.locator('a[href^="/reports/"]').first();
    await expect(firstReport).toBeVisible();
    await firstReport.click();

    await expect(page).toHaveURL(/\/reports\/\d+/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    expect(pageErrors, `page errors:\n${pageErrors.join("\n")}`).toEqual([]);
  });
});
