import { test, expect } from "@playwright/test";

// IA-32: the header sign-in link used to be a bare /login — a guest reading a
// project page landed in the cabinet after signing in, losing their place.
// header.tsx now carries `?from=` the same way the report's own apply-button
// login links already did. Reuses the seeded brand@test.com account rather
// than registering one, so there's nothing for the global teardown to clean
// up here.
test.describe("guest — header sign-in return", () => {
  test("clicking the header sign-in link on a project page returns there after login", async ({
    page,
  }) => {
    // Don't hardcode a project id — take whatever the catalog offers first,
    // same as guest.spec.ts, so the spec survives a change of seed data.
    await page.goto("/catalog");
    const firstReport = page.locator('a[href^="/reports/"]').first();
    await expect(firstReport).toBeVisible();
    const reportPath = new URL(
      (await firstReport.getAttribute("href"))!,
      page.url(),
    ).pathname;

    await page.goto(reportPath);

    // Assert the intermediate step, not just where we end up — a redirect
    // that happened to land right for some other reason would otherwise pass.
    const signInLink = page.locator("header").getByRole("link", { name: "Մուտք / Գրանցում" });
    await expect(signInLink).toBeVisible();
    const href = await signInLink.getAttribute("href");
    expect(href).toBe(`/login?from=${encodeURIComponent(reportPath)}`);

    await signInLink.click();
    await expect(page).toHaveURL(`/login?from=${encodeURIComponent(reportPath)}`);

    await page.fill('input[name="email"]', "brand@test.com");
    await page.fill('input[name="password"]', "brand1234");
    await page.getByRole("button", { name: "Մուտք", exact: true }).click();

    // Back on the project, not the brand cabinet it would otherwise redirect to.
    await page.waitForURL(reportPath, { timeout: 20000 });
    await expect(page).toHaveURL(reportPath);
  });
});
