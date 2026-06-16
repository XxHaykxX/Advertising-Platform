import { chromium } from "playwright";
const b = await chromium.launch();
const errors = [];
const p = await b.newPage({ viewport: { width: 1366, height: 900 } });
p.on("console", (m) => m.type() === "error" && errors.push(m.text()));
p.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
await p.goto("http://localhost:3000/", { waitUntil: "networkidle" });

// jump to catalog
await p.evaluate(() => document.querySelector("#catalog")?.scrollIntoView());
await p.waitForTimeout(1200);

const cards = await p.locator("#catalog article").count();
await p.locator("#catalog").screenshot({ path: "scripts/catalog-full.png" });

// open a modal
await p.locator("#catalog article").first().click();
await p.waitForTimeout(700);
const modalOpen = await p.locator("text=Оставить заявку на этот проект").count();
await p.screenshot({ path: "scripts/catalog-modal.png" });

// filter test: type a query that matches one
await p.keyboard.press("Escape");
await p.waitForTimeout(300);
await p.locator('#catalog input[placeholder^="Поиск"]').fill("орбита");
await p.waitForTimeout(500);
const afterSearch = await p.locator("#catalog article").count();

console.log(JSON.stringify({ cards, modalOpen, afterSearch, errors }, null, 2));
await b.close();
