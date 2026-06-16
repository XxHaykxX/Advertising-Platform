import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const PASS = process.env.ADMIN_PASSWORD || "admin1234";

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle" });
await page.fill('input[name="password"]', PASS);
await page.click('button[type="submit"]');
await page.waitForURL(`${BASE}/admin`, { timeout: 20000 }).catch(() => {});

// ── content: change hero eyebrow ──
await page.goto(`${BASE}/admin/content`, { waitUntil: "networkidle" });
await page.fill('input[name="ru:hero.eyebrow"]', "QA Эйбра");
await page.click('button:has-text("Сохранить тексты")');
await page.waitForSelector("text=Сохранено", { timeout: 10000 });

await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
const heroChanged = await page.locator("text=QA Эйбра").count();

// ── contacts: change phone ──
await page.goto(`${BASE}/admin/settings`, { waitUntil: "networkidle" });
await page.fill('input[name="contact_phone"]', "+7 111 222-33-44");
await page.click('button:has-text("Сохранить контакты")');
await page.waitForSelector("text=Сохранено", { timeout: 10000 });

await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
const phoneChanged = await page.locator("text=+7 111 222-33-44").count();

// ── restore defaults ──
await page.goto(`${BASE}/admin/content`, { waitUntil: "networkidle" });
await page.fill('input[name="ru:hero.eyebrow"]', "Product placement в кино");
await page.click('button:has-text("Сохранить тексты")');
await page.waitForSelector("text=Сохранено", { timeout: 10000 });

await page.goto(`${BASE}/admin/settings`, { waitUntil: "networkidle" });
await page.fill('input[name="contact_phone"]', "+7 999 000-00-00");
await page.click('button:has-text("Сохранить контакты")');
await page.waitForSelector("text=Сохранено", { timeout: 10000 });

console.log("hero text changed on site:", heroChanged > 0);
console.log("phone changed on site:", phoneChanged > 0);
console.log("restored defaults: done");

await browser.close();
