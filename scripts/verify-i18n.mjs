import { chromium } from "playwright";

const BASE = "http://localhost:3000";

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

// default RU
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
const ruNav = await page.locator("header").getByText("Как это работает").count();
const ruLang = await page.getAttribute("html", "lang");

// switch to EN (desktop switcher in header)
await page.locator("header").getByRole("button", { name: "EN", exact: true }).first().click();
await page.waitForTimeout(1500);
const enNav = await page.locator("header").getByText("How it works").count();
const enCatalog = await page.locator("header").getByText("Catalog").count();
const enLang = await page.getAttribute("html", "lang");

// switch to HY
await page.locator("header").getByRole("button", { name: "HY", exact: true }).first().click();
await page.waitForTimeout(1500);
const hyNav = await page.locator("header").getByText("Ինչպես է աշխատում").count();
const hyLang = await page.getAttribute("html", "lang");

// back to RU
await page.locator("header").getByRole("button", { name: "RU", exact: true }).first().click();
await page.waitForTimeout(1500);
const backLang = await page.getAttribute("html", "lang");

console.log("RU: nav", ruNav > 0, "| lang", ruLang);
console.log("EN: navHow", enNav > 0, "navCatalog", enCatalog > 0, "| lang", enLang);
console.log("HY: nav", hyNav > 0, "| lang", hyLang);
console.log("restored lang:", backLang);

await browser.close();
