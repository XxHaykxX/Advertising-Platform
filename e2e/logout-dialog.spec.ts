import { test, expect } from "@playwright/test";

// IA-33 — the logout confirmation used to let the page scroll behind it and
// let Tab walk straight out onto the links underneath. Guards the fix in
// src/components/logout-button.tsx (wired to useModalDialog). Signs in as the
// brand@test.com fixture (not an e2e- account, so the global teardown leaves
// it alone) and closes the dialog with Escape rather than confirming — a
// confirmed logout here would leave the session dead for whatever runs next.
test.describe("logout confirmation dialog — focus trap + scroll lock (IA-33)", () => {
  test("wheel doesn't scroll the page, Tab can't leave the dialog, body is locked while it's open", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "brand@test.com");
    await page.fill('input[name="password"]', "brand1234");
    await page.locator('form button[type="submit"]').click();
    await page.waitForURL((u) => u.pathname === "/account/brand", { timeout: 20000 });

    // The dashboard alone may not be tall enough for a wheel to move anything
    // — pad the page so "did it scroll" is a meaningful question regardless
    // of how much the seed data renders. The bug is the missing lock, not the
    // page's natural height.
    await page.evaluate(() => {
      const spacer = document.createElement("div");
      spacer.style.height = "3000px";
      document.body.appendChild(spacer);
    });

    const trigger = page.getByRole("button", { name: "Դուրս գալ" });
    await trigger.click();

    const dialog = page.getByRole("dialog");
    // A dead browser/session eats clicks and keys with no error (cost the
    // team lead a manual run earlier) — assert the dialog is actually up
    // before measuring anything, so this fails loudly instead of passing on
    // a page where nothing happened.
    await expect(dialog).toBeVisible({ timeout: 10000 });

    // 1. wheel over the dialog must not move the page behind it.
    const scrollBefore = await page.evaluate(() => window.scrollY);
    const box = (await dialog.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, 800);
    const scrollAfter = await page.evaluate(() => window.scrollY);
    expect(scrollAfter, "wheel over the dialog scrolled the page behind it").toBe(scrollBefore);

    // 2. body carries the scroll lock while the dialog is open.
    const overflowWhileOpen = await page.evaluate(() => getComputedStyle(document.body).overflow);
    expect(overflowWhileOpen).toBe("hidden");

    // 3. Tab never leaves the dialog. Two buttons inside it (No / Yes) means
    // four presses wrap around twice — checked every time so a broken trap
    // that only holds for one Tab doesn't slip through.
    for (let i = 1; i <= 4; i++) {
      await page.keyboard.press("Tab");
      const insideDialog = await page.evaluate(
        () => document.activeElement?.closest('[role="dialog"]') != null
      );
      expect(insideDialog, `Tab #${i} landed outside the dialog`).toBe(true);
    }

    // Escape closes it and hands focus back to the trigger, not the top of
    // the page.
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    const focusReturnedToTrigger = await trigger.evaluate((el) => el === document.activeElement);
    expect(focusReturnedToTrigger, "focus did not return to the logout button").toBe(true);

    // ...and the lock is lifted again once it's closed.
    const overflowAfterClose = await page.evaluate(() => getComputedStyle(document.body).overflow);
    expect(overflowAfterClose).not.toBe("hidden");
  });
});
