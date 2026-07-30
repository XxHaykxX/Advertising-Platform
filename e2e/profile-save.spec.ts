import { test, expect } from "@playwright/test";

/* IA-34, and the IA-15 family it belongs to. React resets a form once its
   `action` has run, which puts every field back to the value the page loaded
   with for one frame before the controlled value is re-applied. On the brand
   profile that made the budget select visibly flash the previously saved
   option on every save. IA-15 was the same mechanism leaving the stale value
   on screen for good; it has now regressed twice, so it gets a guard.

   Sampling has to be per animation frame: the flash is one frame (~17ms), and
   a 16ms timer steps straight over it — that is exactly how the first
   investigation concluded "cannot reproduce". */
test.describe("brand profile — saving", () => {
  test("the budget select never flashes another value while saving", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "brand@test.com");
    await page.fill('input[name="password"]', "brand1234");
    await page.locator("form button[type=submit]").first().click();
    await page.waitForURL((u) => u.pathname === "/account/brand", { timeout: 20000 });

    await page.goto("/account/brand/profile");
    const select = page.locator('select[name="budgetRange"]');
    await expect(select).toBeVisible();
    const original = await select.inputValue();

    // Two saves in the same page load: the second one is what broke on the
    // IA-15 reopen, so once is not enough to call this covered.
    for (const value of ["5-20M", "1-5M"]) {
      await select.selectOption(value);

      await page.evaluate(() => {
        const w = window as unknown as { __frames: string[]; __raf: number };
        w.__frames = [];
        const el = document.querySelector('select[name="budgetRange"]') as HTMLSelectElement;
        const tick = () => {
          w.__frames.push(el.value);
          w.__raf = requestAnimationFrame(tick);
        };
        tick();
      });

      await page.locator("form button[type=submit]").first().click();
      await expect(page.getByText("Պահպանված է")).toBeVisible({ timeout: 15000 });

      const seen = await page.evaluate(() => {
        const w = window as unknown as { __frames: string[]; __raf: number };
        cancelAnimationFrame(w.__raf);
        return [...new Set(w.__frames)];
      });

      // The whole point: one distinct value across every frame of the save.
      expect(seen, `budget select changed value mid-save: ${seen.join(" -> ")}`).toEqual([value]);
      await expect(page.getByText("Պահպանված է")).toBeHidden({ timeout: 10000 });
    }

    // Leave the account as it was found.
    await select.selectOption(original);
    await page.locator("form button[type=submit]").first().click();
    await expect(page.getByText("Պահպանված է")).toBeVisible({ timeout: 15000 });
  });
});
