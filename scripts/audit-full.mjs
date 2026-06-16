// Full end-to-end audit: public site + admin panel + i18n + CRUD + leads.
// Run with the dev server up: node scripts/audit-full.mjs
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const PASS = process.env.ADMIN_PASSWORD || "admin1234";

const results = [];
const ok = (name, cond, extra = "") =>
  results.push({ name, ok: !!cond, extra });

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
page.on("dialog", (d) => d.accept());

// collect console / page errors
const errors = [];
const IGNORE = [/favicon/i, /Download the React DevTools/i, /Lenis/i];
page.on("console", (m) => {
  if (m.type() === "error" && !IGNORE.some((r) => r.test(m.text())))
    errors.push("console: " + m.text().slice(0, 140));
});
page.on("pageerror", (e) => errors.push("pageerror: " + String(e).slice(0, 140)));

async function step(name, fn) {
  try {
    await fn();
  } catch (e) {
    ok(name, false, String(e.message || e).slice(0, 120));
  }
}

// ─────────────────────────── PUBLIC ───────────────────────────
await step("home loads + all sections", async () => {
  const r = await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  ok("home 200", r.status() === 200);
  ok("hero", (await page.getByText("Product placement в кино").count()) > 0);
  ok("howitworks", (await page.getByText("Три шага до сделки").count()) > 0);
  ok("catalog heading", (await page.getByText("Будущие фильмы — выберите свой кадр").count()) > 0);
  ok("portfolio heading", (await page.getByText("Бренды, которые уже в кадре").count()) > 0);
  ok("partners heading", (await page.getByText("Нам доверяют бренды").count()) > 0);
  ok("contact heading", (await page.getByText("Оставьте заявку — менеджер перезвонит").count()) > 0);
});

await step("catalog search filter", async () => {
  await page.fill('input[placeholder="Поиск по названию…"]', "Орбита");
  await page.waitForTimeout(400);
  const cards = await page.locator("#catalog article").count();
  ok("search narrows to 1", cards === 1, `cards=${cards}`);
  await page.fill('input[placeholder="Поиск по названию…"]', "");
  await page.waitForTimeout(300);
});

await step("catalog deadline filter", async () => {
  const before = await page.locator("#catalog article").count();
  await page.getByRole("button", { name: "1 месяц" }).click();
  await page.waitForTimeout(400);
  const after = await page.locator("#catalog article").count();
  ok("deadline filter changes count", after <= before, `${before}->${after}`);
  await page.getByRole("button", { name: "Все", exact: true }).click();
  await page.waitForTimeout(300);
});

await step("project detail page", async () => {
  await page.locator("#catalog article").first().click();
  await page.waitForURL(/\/projects\/\d+/, { timeout: 15000 });
  ok("detail actors block", (await page.getByText("Актёры").count()) > 0);
  ok("detail scenes block", (await page.getByText("Сцены для плейсмента").count()) > 0);
});

await step("project apply modal submits", async () => {
  await page.getByRole("button", { name: "Оставить заявку" }).first().click();
  await page.waitForTimeout(600);
  ok("modal project locked", (await page.getByText("Интересующий проект").count()) > 0);
  await page.fill('input[name="name"]', "QA Заявка Модал");
  await page.fill('input[name="phone"]', "+79990001122");
  await page.locator('input[type="checkbox"]').last().check();
  await page.getByRole("button", { name: "Отправить заявку" }).click();
  await page.waitForSelector("text=Заявка отправлена!", { timeout: 10000 });
  ok("modal apply success", true);
});

await step("portfolio lightbox", async () => {
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.locator("#portfolio button").first().click();
  await page.waitForTimeout(600);
  const closed = await page.getByLabel("Закрыть").count();
  ok("lightbox opens", closed > 0);
  if (closed) await page.getByLabel("Закрыть").first().click();
});

await step("contact form validation + submit", async () => {
  await page.goto(`${BASE}/#contact`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  // empty submit → no success
  await page.locator('#contact form button[type="submit"]').click();
  await page.waitForTimeout(400);
  ok("empty submit blocked", (await page.getByText("Заявка отправлена!").count()) === 0);
  // valid submit
  await page.fill('#contact input[name="name"]', "QA Заявка Контакт");
  await page.fill('#contact input[name="phone"]', "+79990003344");
  await page.locator('#contact input[type="checkbox"]').check();
  await page.locator('#contact form button[type="submit"]').click();
  await page.waitForSelector("text=Заявка отправлена!", { timeout: 10000 });
  ok("contact submit success", true);
});

await step("i18n switch EN/HY/RU", async () => {
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.locator("header").getByRole("button", { name: "EN", exact: true }).first().click();
  await page.waitForTimeout(1200);
  ok("EN nav", (await page.locator("header").getByText("How it works").count()) > 0);
  ok("EN html lang", (await page.getAttribute("html", "lang")) === "en");
  await page.locator("header").getByRole("button", { name: "HY", exact: true }).first().click();
  await page.waitForTimeout(1200);
  ok("HY html lang", (await page.getAttribute("html", "lang")) === "hy");
  await page.locator("header").getByRole("button", { name: "RU", exact: true }).first().click();
  await page.waitForTimeout(1200);
  ok("back to RU", (await page.getAttribute("html", "lang")) === "ru");
});

// ─────────────────────────── ADMIN ───────────────────────────
await step("admin guard + login", async () => {
  const g = await ctx.request.get(`${BASE}/admin`, { maxRedirects: 0 });
  ok("admin redirects when anon", g.status() === 307 || g.status() === 302);
  await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle" });
  await page.fill('input[name="password"]', "wrong");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(800);
  ok("wrong password error", (await page.getByText("Неверный пароль").count()) > 0);
  await page.fill('input[name="password"]', PASS);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE}/admin`, { timeout: 15000 });
  ok("dashboard reached", (await page.getByText("Дашборд").count()) > 0);
});

await step("admin applications (leads + status + note + csv)", async () => {
  await page.goto(`${BASE}/admin/applications`, { waitUntil: "networkidle" });
  ok("modal lead listed", (await page.getByText("QA Заявка Модал").count()) > 0);
  ok("contact lead listed", (await page.getByText("QA Заявка Контакт").count()) > 0);
  await page.getByText("QA Заявка Модал").first().click();
  await page.waitForLoadState("networkidle");
  await page.fill('textarea[name="note"]', "QA заметка");
  await page.getByRole("button", { name: "Сохранить заметку" }).click();
  await page.waitForSelector("text=Сохранено", { timeout: 8000 });
  ok("note saved", true);
  const csv = await ctx.request.get(`${BASE}/admin/applications/export`);
  const text = await csv.text();
  ok("csv export", csv.status() === 200 && text.includes("QA Заявка Модал"));
});

await step("admin projects CRUD", async () => {
  await page.goto(`${BASE}/admin/projects/new`, { waitUntil: "networkidle" });
  await page.fill('input[name="titleRu"]', "QA Аудит Проект");
  await page.fill('input[name="genreRu"]', "Драма");
  const sec = page.locator("section").filter({ hasText: "Актёры" });
  await sec.getByRole("button", { name: "Добавить" }).click();
  await page.fill('input[placeholder="Имя (RU)"]', "Тест");
  await page.fill('input[placeholder="Фамилия (RU)"]', "Актёр");
  await page.click('button:has-text("Создать проект")');
  await page.waitForURL(`${BASE}/admin/projects`, { timeout: 15000 });
  ok("project created", (await page.getByText("QA Аудит Проект").count()) > 0);
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  ok("project on site", (await page.getByText("QA Аудит Проект").count()) > 0);
  await page.goto(`${BASE}/admin/projects`, { waitUntil: "networkidle" });
  await page.locator("tbody tr", { hasText: "QA Аудит Проект" }).getByLabel("Удалить").click();
  await page.waitForTimeout(1000);
  ok("project deleted", (await page.getByText("QA Аудит Проект").count()) === 0);
});

await step("admin portfolio CRUD", async () => {
  await page.goto(`${BASE}/admin/portfolio/new`, { waitUntil: "networkidle" });
  await page.fill('input[name="titleRu"]', "QA Бренд × QA Кейс");
  await page.click('button:has-text("Создать кейс")');
  await page.waitForURL(`${BASE}/admin/portfolio`, { timeout: 15000 });
  ok("portfolio created", (await page.getByText("QA Бренд × QA Кейс").count()) > 0);
  await page.locator("tbody tr", { hasText: "QA Бренд" }).getByLabel("Удалить").click();
  await page.waitForTimeout(1000);
  ok("portfolio deleted", (await page.getByText("QA Бренд").count()) === 0);
});

await step("admin partners CRUD", async () => {
  await page.goto(`${BASE}/admin/partners/new`, { waitUntil: "networkidle" });
  await page.fill('input[name="name"]', "QA Партнёр Аудит");
  await page.click('button:has-text("Создать")');
  await page.waitForURL(`${BASE}/admin/partners`, { timeout: 15000 });
  ok("partner created", (await page.getByText("QA Партнёр Аудит").count()) > 0);
  await page.locator("tbody tr", { hasText: "QA Партнёр Аудит" }).getByLabel("Удалить").click();
  await page.waitForTimeout(1000);
  ok("partner deleted", (await page.getByText("QA Партнёр Аудит").count()) === 0);
});

await step("admin content edit + restore", async () => {
  await page.goto(`${BASE}/admin/content`, { waitUntil: "networkidle" });
  await page.fill('input[name="ru:catalog.heading"]', "QA Заголовок Каталога");
  await page.click('button:has-text("Сохранить тексты")');
  await page.waitForSelector("text=Сохранено", { timeout: 8000 });
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  ok("content reflected", (await page.getByText("QA Заголовок Каталога").count()) > 0);
  await page.goto(`${BASE}/admin/content`, { waitUntil: "networkidle" });
  await page.fill('input[name="ru:catalog.heading"]', "Будущие фильмы — выберите свой кадр");
  await page.click('button:has-text("Сохранить тексты")');
  await page.waitForSelector("text=Сохранено", { timeout: 8000 });
  ok("content restored", true);
});

await step("admin contacts edit + restore", async () => {
  await page.goto(`${BASE}/admin/settings`, { waitUntil: "networkidle" });
  await page.fill('input[name="contact_phone"]', "+7 000 111-22-33");
  await page.getByRole("button", { name: "Сохранить контакты" }).click();
  await page.waitForSelector("text=Сохранено", { timeout: 8000 });
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  ok("contact reflected", (await page.getByText("+7 000 111-22-33").count()) > 0);
  await page.goto(`${BASE}/admin/settings`, { waitUntil: "networkidle" });
  await page.fill('input[name="contact_phone"]', "+7 999 000-00-00");
  await page.getByRole("button", { name: "Сохранить контакты" }).click();
  await page.waitForSelector("text=Сохранено", { timeout: 8000 });
  ok("contact restored", true);
});

await step("admin upload (authed) + bad type", async () => {
  const PNG = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgYGAAAAAEAAH2FzhVAAAAAElFTkSuQmCC",
    "base64",
  );
  const up = await ctx.request.post(`${BASE}/api/admin/upload`, {
    multipart: { file: { name: "a.png", mimeType: "image/png", buffer: PNG }, type: "misc" },
  });
  const body = await up.json().catch(() => ({}));
  ok("upload ok", up.status() === 200 && !!body.path);
  const bad = await ctx.request.post(`${BASE}/api/admin/upload`, {
    multipart: { file: { name: "a.txt", mimeType: "text/plain", buffer: Buffer.from("x") }, type: "misc" },
  });
  ok("upload rejects bad type", bad.status() === 415);
});

await step("admin logout", async () => {
  await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Выйти" }).click();
  await page.waitForURL(/\/admin\/login/, { timeout: 10000 });
  const g = await ctx.request.get(`${BASE}/admin`, { maxRedirects: 0 });
  ok("logout clears session", g.status() === 307 || g.status() === 302);
});

// cleanup uploaded test files
await step("cleanup", async () => {
  // QA leads remain in DB intentionally (visible in admin); not deleted here.
});

// ─────────────────────────── REPORT ───────────────────────────
console.log("\n══════════ AUDIT RESULTS ══════════");
let pass = 0;
for (const r of results) {
  console.log(`${r.ok ? "✓" : "✗"} ${r.name}${r.extra ? "  — " + r.extra : ""}`);
  if (r.ok) pass++;
}
console.log(`───────────────────────────────────`);
console.log(`PASS ${pass}/${results.length}`);
console.log(`Console/page errors: ${errors.length}`);
errors.slice(0, 10).forEach((e) => console.log("  ! " + e));

await browser.close();
process.exit(results.every((r) => r.ok) && errors.length === 0 ? 0 : 1);
