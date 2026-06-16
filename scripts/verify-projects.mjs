import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const PASS = process.env.ADMIN_PASSWORD || "admin1234";
const TITLE = "Тестовый проект QA";
const TITLE2 = "Тестовый проект QA2";

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
page.on("dialog", (d) => d.accept());

async function login() {
  await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle" });
  await page.fill('input[name="password"]', PASS);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE}/admin`, { timeout: 20000 }).catch(() => {});
}

await login();

// list baseline
await page.goto(`${BASE}/admin/projects`, { waitUntil: "networkidle" });
const baseRows = await page.locator("tbody tr").count();

// create
await page.click("text=Новый проект");
await page.waitForLoadState("networkidle");
await page.fill('input[name="titleRu"]', TITLE);
await page.fill('input[name="genreRu"]', "Драма");
await page.fill('input[name="slotsTotal"]', "5");
await page.fill('input[name="slotsAvailable"]', "2");
// actor (scope to the Актёры section — "Добавить" also exists in Медиа)
const actorsSection = page.locator("section").filter({ hasText: "Актёры" });
await actorsSection.getByRole("button", { name: "Добавить" }).click();
await page.fill('input[placeholder="Имя (RU)"]', "Иван");
await page.fill('input[placeholder="Фамилия (RU)"]', "Тестов");
await page.fill('input[placeholder="Роль (RU)"]', "Главный");
// scene
const scenesSection = page.locator("section").filter({ hasText: "Сцены для плейсмента" });
await scenesSection.getByRole("button", { name: "Добавить" }).click();
await page.fill('input[placeholder="Название сцены (RU)"]', "Сцена один");
await page.fill('textarea[placeholder="Описание сцены (RU)"]', "Описание");
await page.fill('textarea[placeholder="Что и где можно разместить (RU)"]', "Логотип на столе");
await page.click('button:has-text("Создать проект")');
await page.waitForURL(`${BASE}/admin/projects`, { timeout: 20000 });
await page.waitForTimeout(500);
const afterCreate = await page.locator(`text=${TITLE}`).count();

// public reflect
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
const onSite = await page.locator(`text=${TITLE}`).count();

// edit
await page.goto(`${BASE}/admin/projects`, { waitUntil: "networkidle" });
await page.click(`text=${TITLE}`);
await page.waitForLoadState("networkidle");
await page.fill('input[name="titleRu"]', TITLE2);
await page.click('button:has-text("Сохранить")');
await page.waitForURL(`${BASE}/admin/projects`, { timeout: 20000 });
await page.waitForTimeout(500);
const afterEdit = await page.locator(`text=${TITLE2}`).count();

// delete
const rowsBeforeDelete = await page.locator("tbody tr").count();
const row = page.locator("tbody tr", { hasText: TITLE2 });
await row.getByLabel("Удалить").click();
await page.waitForTimeout(1200);
const afterDelete = await page.locator(`text=${TITLE2}`).count();
const rowsAfterDelete = await page.locator("tbody tr").count();

console.log("baseRows:", baseRows);
console.log("created:", afterCreate > 0, "| onPublicSite:", onSite > 0);
console.log("edited→QA2:", afterEdit > 0);
console.log("deleted:", afterDelete === 0, `| rows ${rowsBeforeDelete}→${rowsAfterDelete}`);

await browser.close();
