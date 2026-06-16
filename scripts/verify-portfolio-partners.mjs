import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const PASS = process.env.ADMIN_PASSWORD || "admin1234";

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
page.on("dialog", (d) => d.accept());

await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle" });
await page.fill('input[name="password"]', PASS);
await page.click('button[type="submit"]');
await page.waitForURL(`${BASE}/admin`, { timeout: 20000 }).catch(() => {});

// ── Partner ──
await page.goto(`${BASE}/admin/partners/new`, { waitUntil: "networkidle" });
await page.fill('input[name="name"]', "QA Партнёр");
await page.fill('input[name="url"]', "https://example.com");
await page.click('button:has-text("Создать")');
await page.waitForURL(`${BASE}/admin/partners`, { timeout: 20000 });
const partnerListed = await page.locator("text=QA Партнёр").count();

await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
const partnerOnSite = await page.locator("text=QA Партнёр").count();

// ── Portfolio ──
await page.goto(`${BASE}/admin/portfolio/new`, { waitUntil: "networkidle" });
await page.fill('input[name="titleRu"]', "QA Бренд × QA Фильм");
await page.fill('textarea[name="descriptionRu"]', "Тестовый кейс");
await page.fill('input[name="videoUrl"]', "https://www.youtube.com/watch?v=aqz-KE-bpKQ");
await page.click('button:has-text("Создать кейс")');
await page.waitForURL(`${BASE}/admin/portfolio`, { timeout: 20000 });
const caseListed = await page.locator("text=QA Бренд × QA Фильм").count();

await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
const caseOnSite = await page.locator("text=QA Фильм").count();

// ── Cleanup (delete both) ──
await page.goto(`${BASE}/admin/partners`, { waitUntil: "networkidle" });
await page.locator("tbody tr", { hasText: "QA Партнёр" }).getByLabel("Удалить").click();
await page.waitForTimeout(1000);
const partnerDeleted = (await page.locator("text=QA Партнёр").count()) === 0;

await page.goto(`${BASE}/admin/portfolio`, { waitUntil: "networkidle" });
await page.locator("tbody tr", { hasText: "QA Бренд" }).getByLabel("Удалить").click();
await page.waitForTimeout(1000);
const caseDeleted = (await page.locator("text=QA Бренд").count()) === 0;

console.log("partner: listed", partnerListed > 0, "| onSite", partnerOnSite > 0, "| deleted", partnerDeleted);
console.log("portfolio: listed", caseListed > 0, "| onSite", caseOnSite > 0, "| deleted", caseDeleted);

await browser.close();
