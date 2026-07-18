import { test, expect } from "@playwright/test";

// Members self-register into APPROVED and are signed in immediately, then
// role-routed: CREATOR → /account, BRAND → /account/brand (the F13 fix). All
// accounts use the e2e- email prefix + "E2E Brand/Creator" name so the global
// teardown can remove them.
const uniqueEmail = (role: string) =>
  `e2e-${role}-${Date.now()}-${Math.floor(Math.random() * 1e4)}@test.local`;

async function fillCommon(page: import("@playwright/test").Page, name: string, email: string) {
  await page.fill('input[name="name"]', name);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "e2e-pass-1234");
}

test.describe("member registration + role routing", () => {
  test("BRAND registers → lands in the brand cabinet (/account/brand)", async ({ page }) => {
    await page.goto("/register"); // default account type = brand
    await fillCommon(page, "E2E Brand", uniqueEmail("brand"));
    await page.getByRole("button", { name: "Գրանցվել", exact: true }).click();
    await page.waitForURL((u) => u.pathname === "/account/brand", { timeout: 20000 });
    await expect(page).toHaveURL(/\/account\/brand$/);
  });

  test("CREATOR registers → lands in /account", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("button", { name: /Ստեղծագործող/ }).click(); // switch type → creator
    await fillCommon(page, "E2E Creator", uniqueEmail("creator"));
    await page.getByRole("button", { name: "Գրանցվել", exact: true }).click();
    await page.waitForURL((u) => u.pathname === "/account", { timeout: 20000 });
  });
});

test.describe("brand — express & withdraw interest (V8)", () => {
  test("registers a brand, expresses interest, then removes it", async ({ page }) => {
    await page.goto("/register");
    await fillCommon(page, "E2E Brand", uniqueEmail("brand"));
    await page.getByRole("button", { name: "Գրանցվել", exact: true }).click();
    await page.waitForURL((u) => u.pathname === "/account/brand", { timeout: 20000 });

    await page.goto("/account/brand/browse");
    const express = page.getByRole("button", { name: "Ցուցաբերել հետաքրքրություն" }).first();
    await expect(express).toBeVisible();
    await express.click();

    // Optimistic toggle → the card now offers "remove from interests".
    const remove = page.getByRole("button", { name: "Հանել հետաքրքրություններից" }).first();
    await expect(remove).toBeVisible({ timeout: 10000 });

    // The interest shows up in the My Interests page.
    await page.goto("/account/brand/interests");
    await expect(page.locator('a[href^="/reports/"]').first()).toBeVisible();

    // Withdraw it again (leaves the DB clean for teardown regardless).
    await page.goto("/account/brand/browse");
    const removeAgain = page.getByRole("button", { name: "Հանել հետաքրքրություններից" }).first();
    if (await removeAgain.isVisible().catch(() => false)) {
      await removeAgain.click();
      await expect(
        page.getByRole("button", { name: "Ցուցաբերել հետաքրքրություն" }).first(),
      ).toBeVisible({ timeout: 10000 });
    }
  });
});
