import { chromium } from "playwright";

const browser = await chromium.launch();
const errors = [];

// desktop
const page = await browser.newPage({ viewport: { width: 1366, height: 800 } });
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await page.waitForTimeout(900);

const navCount = await page.locator("header nav button").count();
const hasCTA = await page
  .locator("header", { hasText: "Оставить заявку" })
  .count();

// transparent over hero
await page.screenshot({ path: "scripts/hdr-top.png", clip: { x: 0, y: 0, width: 1366, height: 110 } });

// scrolled → glass
await page.evaluate(() => window.scrollTo({ top: 300, behavior: "instant" }));
await page.waitForTimeout(600);
await page.screenshot({ path: "scripts/hdr-scrolled.png", clip: { x: 0, y: 0, width: 1366, height: 110 } });

// mobile burger menu
const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
await m.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await m.waitForTimeout(700);
await m.getByLabel("Открыть меню").click();
await m.waitForTimeout(600);
const menuLinks = await m.locator("nav button").count();
await m.screenshot({ path: "scripts/hdr-mobile-menu.png" });

console.log(JSON.stringify({ navCount, hasCTA, menuLinks, errors }, null, 2));
await browser.close();
