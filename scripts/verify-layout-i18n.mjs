import { chromium } from "playwright";
import fs from "node:fs";

const BASE = "http://localhost:3000";
const LOCALES = ["ru", "en", "hy"];
const VIEWPORTS = [
  { w: 1536, h: 900, name: "wide" },
  { w: 1366, h: 850, name: "desktop" },
  { w: 1280, h: 800, name: "xl-edge" },
  { w: 1100, h: 800, name: "laptop" },
  { w: 768, h: 900, name: "tablet" },
  { w: 375, h: 800, name: "mobile" },
];

fs.mkdirSync("scripts/shots", { recursive: true });
const browser = await chromium.launch();
const rows = [];

for (const vp of VIEWPORTS) {
  for (const loc of LOCALES) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
    await ctx.addCookies([{ name: "locale", value: loc, url: BASE }]);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(300);

    const data = await page.evaluate(() => {
      const de = document.documentElement;
      const bodyOverflow = de.scrollWidth - de.clientWidth;
      const header = document.querySelector("header");
      let navWrap = false, navOverflow = 0, headerH = 0;
      if (header) {
        headerH = header.getBoundingClientRect().height;
        const nav = header.querySelector("nav");
        if (nav) {
          navOverflow = nav.scrollWidth - nav.clientWidth;
          // wrap detection: nav taller than ~2x a line
          navWrap = nav.getBoundingClientRect().height > 40;
        }
      }
      // any element overflowing viewport horizontally
      const offenders = [];
      document.querySelectorAll("header *, #catalog, footer *").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.right > window.innerWidth + 2 && r.width > 30) {
          offenders.push((el.tagName + "." + (el.className || "").toString().slice(0, 25)).slice(0, 40));
        }
      });
      return { bodyOverflow, headerH, navOverflow, navWrap, offenders: [...new Set(offenders)].slice(0, 4) };
    });

    rows.push({ vp: vp.name, w: vp.w, loc, ...data });
    await page.screenshot({ path: `scripts/shots/${vp.name}-${loc}.png`, clip: { x: 0, y: 0, width: vp.w, height: Math.min(120, vp.h) } });
    await ctx.close();
  }
}

console.log("\n viewport  loc  bodyOvf headerH navOvf wrap  offenders");
for (const r of rows) {
  const flag = r.bodyOverflow > 2 || r.navOverflow > 2 || r.navWrap ? "  <== ISSUE" : "";
  console.log(
    `${r.vp.padEnd(8)} ${r.loc}   ${String(r.bodyOverflow).padStart(5)} ${String(Math.round(r.headerH)).padStart(6)} ${String(r.navOverflow).padStart(5)}  ${r.navWrap ? "Y" : "n"}   ${r.offenders.join(", ")}${flag}`,
  );
}
console.log("\nScreenshots in scripts/shots/");
await browser.close();
