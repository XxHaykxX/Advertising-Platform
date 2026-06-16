import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 800 } });
await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await page.waitForTimeout(800);

const info = await page.evaluate(() => {
  const tile = document.querySelector(".marquee-col > div");
  const wall = document.querySelector(".marquee-col")?.closest("[style]");
  const r = tile?.getBoundingClientRect();
  const cs = tile ? getComputedStyle(tile) : null;
  // sample pixel color at left strip (x=80) at several y
  return {
    tileRect: r && { x: r.x, y: r.y, w: r.width, h: r.height },
    tileBg: cs?.backgroundImage?.slice(0, 60),
    tileOpacity: cs?.opacity,
    tileZ: cs?.zIndex,
    wallStyle: wall?.getAttribute("style"),
    bodyChildren: document.body.innerHTML.length,
  };
});
console.log(JSON.stringify(info, null, 2));

// crop screenshot of left strip where a tile should be
await page.screenshot({
  path: "scripts/shot-leftstrip.png",
  clip: { x: 0, y: 200, width: 280, height: 500 },
});
await browser.close();
