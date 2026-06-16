import { chromium } from "playwright";

const URL = "http://localhost:3000/";
const errors = [];

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1366, height: 800 },
  deviceScaleFactor: 1,
  reducedMotion: "no-preference",
});
const page = await ctx.newPage();
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

// 1) count poster tiles + marquee columns
const tiles = await page.locator(".marquee-col > div").count();
const cols = await page.locator(".marquee-col").count();

// 2) confirm marquee actually moves: sample a tile's box twice
const sample = page.locator(".marquee-col").first().locator("> div").first();
const b1 = await sample.boundingBox();
await page.waitForTimeout(1500);
const b2 = await sample.boundingBox();
const movedMarquee = b1 && b2 ? Math.abs(b1.y - b2.y) > 0.5 : false;

await page.screenshot({ path: "scripts/shot-top.png" });

// 3) scroll-driven parallax: scroll down, check content shifted
await page.evaluate(() => window.scrollTo({ top: 500, behavior: "instant" }));
await page.waitForTimeout(900);
await page.screenshot({ path: "scripts/shot-scrolled.png" });

await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
await page.waitForTimeout(400);

console.log(
  JSON.stringify(
    {
      tiles,
      cols,
      movedMarquee,
      tileDeltaY: b1 && b2 ? +(b2.y - b1.y).toFixed(2) : null,
      errors,
    },
    null,
    2
  )
);

await browser.close();
