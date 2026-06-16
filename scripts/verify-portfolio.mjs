import { chromium } from "playwright";
const b = await chromium.launch();
const errors = [];
const p = await b.newPage({ viewport: { width: 1366, height: 900 } });
p.on("console", (m) => m.type() === "error" && errors.push(m.text()));
p.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
await p.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await p.evaluate(() => document.querySelector("#portfolio")?.scrollIntoView());
await p.waitForTimeout(1200);

const cards = await p.locator("#portfolio button.group").count();
await p.locator("#portfolio").screenshot({ path: "scripts/portfolio-full.png" });

// open lightbox on first card
await p.locator("#portfolio button.group").first().click();
await p.waitForTimeout(700);
const lightboxThumbs = await p.locator("text=AuraDrinks").count();
await p.screenshot({ path: "scripts/portfolio-lightbox.png" });

console.log(JSON.stringify({ cards, lightboxThumbs, errors }, null, 2));
await b.close();
