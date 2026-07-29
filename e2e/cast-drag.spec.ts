import { test, expect } from "@playwright/test";

// Regression guard for the drag-to-scroll strips (useDragScroll).
//
// Cast cards carry a headshot, and an <img> is natively draggable: pressing on
// one and moving started an HTML5 image drag, at which point Chromium stops
// delivering pointermove/pointerup and the strip never scrolled. The gesture
// looked alive (grab cursor, no error) and did nothing — so assert the strip
// actually moved, and start the drag on a photo, which is where it broke.
const STRIP = "#cast div.flex.cursor-grab";

test.describe("report — cast carousel", () => {
  test("drags with the mouse, starting on a headshot", async ({ page }) => {
    await page.goto("/reports/34");

    const strip = page.locator(STRIP).first();
    // Fewer than 5 people in a group renders a plain grid, not a carousel —
    // nothing to drag, and that's a data condition, not a failure.
    test.skip((await page.locator(STRIP).count()) === 0, "no carousel on this project");

    const photo = strip.locator("img").first();
    await expect(photo).toBeVisible();

    // scrollIntoViewIfNeeded waits for a stable box, and Lenis keeps animating
    // the page — scroll by hand and settle instead.
    await strip.evaluate((el) => window.scrollBy(0, el.getBoundingClientRect().top - 300));
    await page.waitForTimeout(600);

    const box = await photo.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });

    await page.mouse.move(box.x, box.y);
    await page.mouse.down();
    for (let i = 1; i <= 8; i++) {
      await page.mouse.move(box.x - i * 25, box.y);
      await page.waitForTimeout(20);
    }
    await page.mouse.up();
    await page.waitForTimeout(300);

    expect(await strip.evaluate((el) => el.scrollLeft)).toBeGreaterThan(50);
  });
});
