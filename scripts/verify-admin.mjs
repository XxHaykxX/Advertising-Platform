import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const PASS = process.env.ADMIN_PASSWORD || "admin1234";

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

// 1. wrong password → error shown, stays on login
await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle" });
await page.fill('input[name="password"]', "wrong-pass");
await page.click('button[type="submit"]');
await page.waitForTimeout(1500);
const wrongUrl = page.url();
const hasError = await page.locator("text=Неверный пароль").count().catch(() => 0);

// 2. correct password → reaches dashboard
await page.fill('input[name="password"]', PASS);
await page.click('button[type="submit"]');
await page.waitForLoadState("networkidle");
await page.waitForTimeout(1000);
const okUrl = page.url();
const onDash = await page.locator("text=Дашборд").count();

// 3. protected page now accessible
await page.goto(`${BASE}/admin/settings`, { waitUntil: "networkidle" });
const onSettings = await page.locator("text=Смена пароля администратора").count();

console.log("wrong → url:", wrongUrl.replace(BASE, ""), "errorShown:", hasError > 0);
console.log("correct → url:", okUrl.replace(BASE, ""), "dashboard:", onDash > 0);
console.log("settings reachable:", onSettings > 0);

await browser.close();
