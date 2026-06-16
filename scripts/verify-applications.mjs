import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const PASS = process.env.ADMIN_PASSWORD || "admin1234";

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

// login
await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle" });
await page.fill('input[name="password"]', PASS);
await page.click('button[type="submit"]');
await page.waitForURL(`${BASE}/admin`, { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(500);
console.log("after login url:", page.url().replace(BASE, ""));

// list
await page.goto(`${BASE}/admin/applications`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
console.log("list url:", page.url().replace(BASE, ""));
const hasRow = await page.locator("text=Тест Тестов").count();
const hasExport = await page.locator("text=Экспорт CSV").count();
console.log("hasRow:", hasRow, "hasExport:", hasExport);
if (hasRow === 0) {
  console.log("BODY SNIPPET:", (await page.content()).slice(0, 400));
  await browser.close();
  process.exit(0);
}

// detail + note save
await page.click("text=Тест Тестов");
await page.waitForLoadState("networkidle");
const hasProject = await page.locator("text=Орбита").count();
await page.fill('textarea[name="note"]', "Перезвонить завтра");
await page.click('button:has-text("Сохранить заметку")');
await page.waitForTimeout(1200);
const noteSaved = await page.locator("text=Сохранено").count();

// CSV export (authenticated request)
const res = await page.request.get(`${BASE}/admin/applications/export`);
const csv = await res.text();
const csvOk = res.status() === 200 && csv.includes("Тест Тестов");

console.log("list row:", hasRow > 0, "| export btn:", hasExport > 0);
console.log("detail project Орбита:", hasProject > 0, "| note saved:", noteSaved > 0);
console.log("csv export:", csvOk, "| status:", res.status());

await browser.close();
