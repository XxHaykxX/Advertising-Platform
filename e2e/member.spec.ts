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

// The phone field is react-international-phone (2026-07-29): it keeps its own
// formatted state, so `fill()` is swallowed and the box stays on the bare
// "+374 " dial code — which is not a number, so submit stays disabled and the
// spec looks like a product bug. Type the national digits like a person would.
async function typePhone(scope: import("@playwright/test").Locator) {
  const field = scope.locator("#apply-phone");
  await field.click();
  await field.pressSequentially("91234567", { delay: 20 });
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

test.describe("brand — sends an offer (V8)", () => {
  // The one-click "express interest" toggle on the browse cards is gone: since
  // dfc188d an application is sent from the project's own page through the
  // popup, because a bare toggle told the seller nothing about what was being
  // asked for. This walks the flow that actually exists.
  test("registers a brand, applies from a project page, sees it in the cabinet", async ({ page }) => {
    await page.goto("/register");
    await fillCommon(page, "E2E Brand", uniqueEmail("brand"));
    await page.getByRole("button", { name: "Գրանցվել", exact: true }).click();
    await page.waitForURL((u) => u.pathname === "/account/brand", { timeout: 20000 });

    // Pick whatever project the catalog offers first — the seed set differs
    // between machines, so no id is hard-coded.
    await page.goto("/account/brand/browse");
    const firstReport = page.locator('a[href^="/reports/"]').first();
    await expect(firstReport).toBeVisible({ timeout: 15000 });
    const href = await firstReport.getAttribute("href");
    await page.goto(href!);

    // One short CTA everywhere since 2026-07-29 ("report.offerBarCta") — the
    // old "Ցուցաբերել հետաքրքրություն" wording is gone from the page.
    await page.getByRole("button", { name: "Ներկայացնել հայտ" }).first().click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10000 });

    // The brief (2026-07-26) — down to this one field since 2026-08-05, when
    // the brand's own price, the deal type and the preferred timing left the
    // form for the negotiation that follows it.
    await dialog.locator("#apply-product").fill("E2E тестовый продукт");
    // A fresh account has no phone on file, so the field is asked for and
    // starts on the +374 dial code alone — which isn't a number yet.
    await typePhone(dialog);
    // Must clear the 20-character minimum, otherwise submit stays disabled.
    await dialog
      .locator("#apply-message")
      .fill("E2E: проверка отправки заявки с брифом и минимальной длиной.");
    await dialog.getByRole("button", { name: "Ուղարկել առաջարկը" }).click();

    // The dialog swaps the form for its success state rather than closing.
    await expect(dialog.getByText("Առաջարկն ուղարկվեց")).toBeVisible({ timeout: 15000 });

    // And the brand's own cabinet shows what it sent — it used to show only a
    // status pill with no trace of the request.
    await page.goto("/account/brand/interests");
    await expect(page.getByText("E2E тестовый продукт")).toBeVisible({ timeout: 15000 });
  });

  test("an application shorter than 20 characters cannot be submitted", async ({ page }) => {
    await page.goto("/register");
    await fillCommon(page, "E2E Brand", uniqueEmail("brand"));
    await page.getByRole("button", { name: "Գրանցվել", exact: true }).click();
    await page.waitForURL((u) => u.pathname === "/account/brand", { timeout: 20000 });

    await page.goto("/account/brand/browse");
    const firstReport = page.locator('a[href^="/reports/"]').first();
    await expect(firstReport).toBeVisible({ timeout: 15000 });
    await page.goto((await firstReport.getAttribute("href"))!);

    // One short CTA everywhere since 2026-07-29 ("report.offerBarCta") — the
    // old "Ցուցաբերել հետաքրքրություն" wording is gone from the page.
    await page.getByRole("button", { name: "Ներկայացնել հայտ" }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10000 });

    await typePhone(dialog);
    await dialog.locator("#apply-message").fill("привет");
    await expect(dialog.getByRole("button", { name: "Ուղարկել առաջարկը" })).toBeDisabled();
  });

  test("an application without a real phone number cannot be submitted", async ({ page }) => {
    await page.goto("/register");
    await fillCommon(page, "E2E Brand", uniqueEmail("brand"));
    await page.getByRole("button", { name: "Գրանցվել", exact: true }).click();
    await page.waitForURL((u) => u.pathname === "/account/brand", { timeout: 20000 });

    await page.goto("/account/brand/browse");
    const firstReport = page.locator('a[href^="/reports/"]').first();
    await expect(firstReport).toBeVisible({ timeout: 15000 });
    await page.goto((await firstReport.getAttribute("href"))!);

    // One short CTA everywhere since 2026-07-29 ("report.offerBarCta") — the
    // old "Ցուցաբերել հետաքրքրություն" wording is gone from the page.
    await page.getByRole("button", { name: "Ներկայացնել հայտ" }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10000 });

    const submit = dialog.getByRole("button", { name: "Ուղարկել առաջարկը" });
    // "What is being placed" became the required field on 2026-07-29 and the
    // free-text message the optional one — fill it so this test is held up by
    // the phone alone, which is what it is about.
    await dialog.locator("#apply-product").fill("E2E тестовый продукт");
    await dialog
      .locator("#apply-message")
      .fill("E2E: сообщение достаточной длины, но телефон не дописан.");
    // The field is seeded with the dial code alone — that must not pass.
    await expect(submit).toBeDisabled();

    await typePhone(dialog);
    await expect(submit).toBeEnabled();
  });
});
