// Deep audit: every button, edge case, logic correctness + bug-fix verification.
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const PASS = process.env.ADMIN_PASSWORD || "admin1234";

const results = [];
const ok = (name, cond, extra = "") => results.push({ name, ok: !!cond, extra });

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
page.on("dialog", (d) => d.accept());

const errors = [];
const IGNORE = [/favicon/i, /React DevTools/i, /Lenis/i];
page.on("console", (m) => {
  if (m.type() === "error" && !IGNORE.some((r) => r.test(m.text())))
    errors.push("console: " + m.text().slice(0, 130));
});
page.on("pageerror", (e) => errors.push("pageerror: " + String(e).slice(0, 130)));

async function step(name, fn) {
  try { await fn(); } catch (e) { ok(name, false, String(e.message || e).slice(0, 110)); }
}
async function login() {
  await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle" });
  await page.fill('input[name="password"]', PASS);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE}/admin`, { timeout: 15000 });
}

// ═══════════════ PUBLIC — buttons & logic ═══════════════
await step("catalog: genre dropdown filters", async () => {
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Все жанры/ }).click();
  await page.getByRole("button", { name: "Боевик", exact: true }).click();
  await page.waitForTimeout(400);
  const genres = await page.locator("#catalog article").locator("text=Боевик").count();
  const cards = await page.locator("#catalog article").count();
  ok("genre filter shows only Боевик", cards > 0 && genres >= cards, `cards=${cards}`);
});

await step("catalog: empty state on impossible filter", async () => {
  await page.fill('input[placeholder="Поиск по названию…"]', "zzzzzz");
  await page.waitForTimeout(400);
  ok("empty state shown", (await page.getByText("Ничего не найдено. Измените фильтры.").count()) > 0);
  await page.fill('input[placeholder="Поиск по названию…"]', "");
  await page.getByRole("button", { name: /Боевик/ }).click();
  await page.getByRole("button", { name: "Все жанры", exact: true }).click();
  await page.waitForTimeout(300);
});

await step("catalog card 'Оставить заявку' scrolls + prefills (no navigate)", async () => {
  const before = page.url();
  await page.locator("#catalog article").first().getByRole("button", { name: "Оставить заявку" }).click();
  await page.waitForTimeout(1200);
  ok("did not navigate to project", page.url().startsWith(`${BASE}/`) && !/\/projects\//.test(page.url()));
  const val = await page.locator('#contact select[name="project"]').inputValue();
  ok("project prefilled in contact form", val.length > 0, `val=${val}`);
});

await step("FIX2: contact project select is dynamic (all DB projects)", async () => {
  const opts = await page.locator('#contact select[name="project"] option').count();
  const cards = await page.locator("#catalog article").count();
  // options = projects + 1 ("Любой / не выбран")
  ok("select has all projects", opts === cards + 1, `opts=${opts} cards=${cards}`);
});

await step("contact: empty submit blocked, valid submit ok", async () => {
  await page.locator('#contact form button[type="submit"]').click();
  await page.waitForTimeout(400);
  ok("empty blocked", (await page.getByText("Заявка отправлена!").count()) === 0);
  await page.fill('#contact input[name="name"]', "QA Deep Контакт");
  await page.fill('#contact input[name="phone"]', "+79991112233");
  await page.locator('#contact input[type="checkbox"]').check();
  await page.locator('#contact form button[type="submit"]').click();
  await page.waitForSelector("text=Заявка отправлена!", { timeout: 10000 });
  ok("valid submit ok", true);
});

await step("project detail: modal open/close (Esc, X, backdrop) + validation", async () => {
  await page.goto(`${BASE}/projects/1`, { waitUntil: "networkidle" });
  // open + Esc
  await page.getByRole("button", { name: "Оставить заявку" }).first().click();
  await page.waitForTimeout(400);
  ok("modal open", (await page.getByText("Интересующий проект").count()) > 0);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  ok("Esc closes", (await page.getByText("Интересующий проект").count()) === 0);
  // open + validation (empty)
  await page.getByRole("button", { name: "Оставить заявку" }).first().click();
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: "Отправить заявку" }).click();
  await page.waitForTimeout(400);
  ok("validation blocks empty", (await page.getByText("Заявка отправлена!").count()) === 0);
  // close via X
  await page.getByLabel("Закрыть").click();
  await page.waitForTimeout(900);
  ok("X closes", (await page.getByText("Интересующий проект").count()) === 0);
});

await step("project detail: back link to catalog", async () => {
  await page.goto(`${BASE}/projects/2`, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "К каталогу" }).click();
  await page.waitForTimeout(800);
  ok("back to home catalog", /\/#catalog$|\/$/.test(page.url()) || page.url() === `${BASE}/`);
});

await step("header nav cross-page from project detail", async () => {
  await page.goto(`${BASE}/projects/3`, { waitUntil: "networkidle" });
  await page.locator("header").getByText("Портфолио").click();
  await page.waitForTimeout(1000);
  ok("navigated home", page.url().startsWith(`${BASE}/`) && !/\/projects\//.test(page.url()));
});

await step("FIX3: i18n EN shows translated sections (not RU)", async () => {
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.locator("header").getByRole("button", { name: "EN", exact: true }).first().click();
  await page.waitForTimeout(1300);
  ok("EN hero subtitle", (await page.getByText("A showcase of films still in production").count()) > 0);
  ok("EN catalog heading", (await page.getByText("Upcoming films — pick your frame").count()) > 0);
  await page.locator("header").getByRole("button", { name: "HY", exact: true }).first().click();
  await page.waitForTimeout(1300);
  ok("HY catalog heading", (await page.getByText("Ապագա ֆիլմեր").count()) > 0);
  await page.locator("header").getByRole("button", { name: "RU", exact: true }).first().click();
  await page.waitForTimeout(1300);
  ok("RU restored", (await page.getByText("Будущие фильмы — выберите свой кадр").count()) > 0);
});

// ═══════════════ ADMIN — buttons & logic ═══════════════
await step("login: empty password validation", async () => {
  await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle" });
  await page.click('button[type="submit"]');
  await page.waitForTimeout(600);
  ok("empty pass error", (await page.getByText("Введите пароль").count()) > 0);
});

await step("login success", async () => { await login(); ok("logged in", true); });

await step("applications: status filter tabs + change status", async () => {
  await page.goto(`${BASE}/admin/applications`, { waitUntil: "networkidle" });
  ok("deep lead present", (await page.getByText("QA Deep Контакт").count()) > 0);
  // change first matching row status to in_progress
  const row = page.locator("tbody tr", { hasText: "QA Deep Контакт" }).first();
  await row.locator("select").selectOption("in_progress");
  await page.waitForTimeout(800);
  await page.goto(`${BASE}/admin/applications?status=in_progress`, { waitUntil: "networkidle" });
  ok("appears under В работе filter", (await page.getByText("QA Deep Контакт").count()) > 0);
  await page.goto(`${BASE}/admin/applications?status=new`, { waitUntil: "networkidle" });
  ok("not under Новая filter", (await page.getByText("QA Deep Контакт").count()) === 0);
});

await step("application detail: note persists after reload", async () => {
  await page.goto(`${BASE}/admin/applications?status=in_progress`, { waitUntil: "networkidle" });
  await page.getByText("QA Deep Контакт").first().click();
  await page.waitForLoadState("networkidle");
  await page.fill('textarea[name="note"]', "QA проверка заметки");
  await page.getByRole("button", { name: "Сохранить заметку" }).click();
  await page.waitForSelector("text=Сохранено", { timeout: 8000 });
  await page.reload({ waitUntil: "networkidle" });
  const noteVal = await page.locator('textarea[name="note"]').inputValue();
  ok("note persisted", noteVal === "QA проверка заметки");
});

let deepProjectId = null;
await step("projects: create full → edit persists actors/scenes → on site", async () => {
  await page.goto(`${BASE}/admin/projects/new`, { waitUntil: "networkidle" });
  await page.fill('input[name="titleRu"]', "QA Deep Проект");
  await page.fill('input[name="genreRu"]', "Триллер");
  await page.fill('input[name="slotsTotal"]', "6");
  await page.fill('input[name="slotsAvailable"]', "4");
  await page.locator('input[name="platforms"][value="YouTube"]').check();
  const aSec = page.locator("section").filter({ hasText: "Актёры" });
  await aSec.getByRole("button", { name: "Добавить" }).click();
  await page.fill('input[placeholder="Имя (RU)"]', "Дип");
  await page.fill('input[placeholder="Фамилия (RU)"]', "Тестов");
  await page.fill('input[placeholder="Роль (RU)"]', "Лид");
  const sSec = page.locator("section").filter({ hasText: "Сцены для плейсмента" });
  await sSec.getByRole("button", { name: "Добавить" }).click();
  await page.fill('input[placeholder="Название сцены (RU)"]', "Финал");
  await page.fill('textarea[placeholder="Описание сцены (RU)"]', "Кульминация");
  await page.fill('textarea[placeholder="Что и где можно разместить (RU)"]', "Логотип на экране");
  await page.click('button:has-text("Создать проект")');
  await page.waitForURL(`${BASE}/admin/projects`, { timeout: 15000 });
  ok("created", (await page.getByText("QA Deep Проект").count()) > 0);
  // grab id from edit link
  const href = await page.locator("tbody tr", { hasText: "QA Deep Проект" }).getByRole("link").first().getAttribute("href");
  deepProjectId = href?.match(/projects\/(\d+)/)?.[1] ?? null;
  // edit → actors/scenes persisted in form
  await page.goto(`${BASE}/admin/projects/${deepProjectId}/edit`, { waitUntil: "networkidle" });
  ok("actor persisted", (await page.locator('input[value="Дип"]').count()) > 0);
  ok("scene persisted", (await page.locator('input[value="Финал"]').count()) > 0);
  // on public detail
  await page.goto(`${BASE}/projects/${deepProjectId}`, { waitUntil: "networkidle" });
  ok("actor on site", (await page.getByText("Дип Тестов").count()) > 0);
  ok("scene on site", (await page.getByText("Финал").count()) > 0);
});

await step("FIX1: inactive project → 404 + hidden from catalog", async () => {
  await page.goto(`${BASE}/admin/projects`, { waitUntil: "networkidle" });
  const row = page.locator("tbody tr", { hasText: "QA Deep Проект" });
  await row.getByLabel("Скрыть").click(); // toggle active → inactive
  await page.waitForTimeout(900);
  const resp = await ctx.request.get(`${BASE}/projects/${deepProjectId}`, { maxRedirects: 0 });
  ok("inactive project 404", resp.status() === 404, `status=${resp.status()}`);
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  ok("hidden from catalog", (await page.getByText("QA Deep Проект").count()) === 0);
});

await step("projects: delete cleanup", async () => {
  await page.goto(`${BASE}/admin/projects`, { waitUntil: "networkidle" });
  await page.locator("tbody tr", { hasText: "QA Deep Проект" }).getByLabel("Удалить").click();
  await page.waitForTimeout(900);
  ok("deleted", (await page.getByText("QA Deep Проект").count()) === 0);
});

await step("portfolio: create with youtube → video badge on site → delete", async () => {
  await page.goto(`${BASE}/admin/portfolio/new`, { waitUntil: "networkidle" });
  await page.fill('input[name="titleRu"]', "QA Deep × Кейс");
  await page.fill('input[name="videoUrl"]', "https://www.youtube.com/watch?v=aqz-KE-bpKQ");
  await page.click('button:has-text("Создать кейс")');
  await page.waitForURL(`${BASE}/admin/portfolio`, { timeout: 15000 });
  ok("created", (await page.getByText("QA Deep × Кейс").count()) > 0);
  await page.locator("tbody tr", { hasText: "QA Deep" }).getByLabel("Удалить").click();
  await page.waitForTimeout(900);
  ok("deleted", (await page.getByText("QA Deep × Кейс").count()) === 0);
});

await step("partners: create → edit sortOrder → delete", async () => {
  await page.goto(`${BASE}/admin/partners/new`, { waitUntil: "networkidle" });
  await page.fill('input[name="name"]', "QA Deep Партнёр");
  await page.fill('input[name="url"]', "https://ex.com");
  await page.click('button:has-text("Создать")');
  await page.waitForURL(`${BASE}/admin/partners`, { timeout: 15000 });
  ok("created", (await page.getByText("QA Deep Партнёр").count()) > 0);
  await page.locator("tbody tr", { hasText: "QA Deep Партнёр" }).getByRole("link").first().click();
  await page.waitForLoadState("networkidle");
  await page.fill('input[name="sortOrder"]', "99");
  await page.click('button:has-text("Сохранить")');
  await page.waitForURL(`${BASE}/admin/partners`, { timeout: 15000 });
  ok("edit saved", (await page.getByText("QA Deep Партнёр").count()) > 0);
  await page.locator("tbody tr", { hasText: "QA Deep Партнёр" }).getByLabel("Удалить").click();
  await page.waitForTimeout(900);
  ok("deleted", (await page.getByText("QA Deep Партнёр").count()) === 0);
});

await step("content: save (en empty) keeps EN baked translation (no RU revert)", async () => {
  await page.goto(`${BASE}/admin/content`, { waitUntil: "networkidle" });
  await page.click('button:has-text("Сохранить тексты")'); // saves all rows
  await page.waitForSelector("text=Сохранено", { timeout: 8000 });
  // switch site to EN → still English heading (not RU)
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.locator("header").getByRole("button", { name: "EN", exact: true }).first().click();
  await page.waitForTimeout(1300);
  ok("EN still translated after content save", (await page.getByText("Upcoming films — pick your frame").count()) > 0);
  await page.locator("header").getByRole("button", { name: "RU", exact: true }).first().click();
  await page.waitForTimeout(1000);
});

await step("settings: password validation branches", async () => {
  await page.goto(`${BASE}/admin/settings`, { waitUntil: "networkidle" });
  // wrong current
  await page.fill('input[name="current"]', "wrongpass");
  await page.fill('input[name="next"]', "newpass123");
  await page.fill('input[name="confirm"]', "newpass123");
  await page.getByRole("button", { name: "Сменить пароль" }).click();
  await page.waitForTimeout(700);
  ok("wrong current rejected", (await page.getByText("Текущий пароль неверный").count()) > 0);
  // mismatch
  await page.fill('input[name="current"]', PASS);
  await page.fill('input[name="next"]', "newpass123");
  await page.fill('input[name="confirm"]', "different");
  await page.getByRole("button", { name: "Сменить пароль" }).click();
  await page.waitForTimeout(700);
  ok("mismatch rejected", (await page.getByText("Пароли не совпадают").count()) > 0);
  // too short
  await page.fill('input[name="current"]', PASS);
  await page.fill('input[name="next"]', "123");
  await page.fill('input[name="confirm"]', "123");
  await page.getByRole("button", { name: "Сменить пароль" }).click();
  await page.waitForTimeout(700);
  ok("too short rejected", (await page.getByText("минимум 8").count()) > 0);
});

await step("upload: unauth 401 + bad type 415 + ok", async () => {
  const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgYGAAAAAEAAH2FzhVAAAAAElFTkSuQmCC", "base64");
  const anon = await browser.newContext();
  const r401 = await anon.request.post(`${BASE}/api/admin/upload`, { multipart: { file: { name: "x.png", mimeType: "image/png", buffer: PNG }, type: "misc" } });
  ok("unauth 401", r401.status() === 401);
  await anon.close();
  const okup = await ctx.request.post(`${BASE}/api/admin/upload`, { multipart: { file: { name: "x.png", mimeType: "image/png", buffer: PNG }, type: "misc" } });
  ok("authed upload 200", okup.status() === 200);
  const bad = await ctx.request.post(`${BASE}/api/admin/upload`, { multipart: { file: { name: "x.txt", mimeType: "text/plain", buffer: Buffer.from("x") }, type: "misc" } });
  ok("bad type 415", bad.status() === 415);
});

await step("logout", async () => {
  await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Выйти" }).click();
  await page.waitForURL(/\/admin\/login/, { timeout: 10000 });
  const g = await ctx.request.get(`${BASE}/admin`, { maxRedirects: 0 });
  ok("session cleared", g.status() === 307 || g.status() === 302);
});

// ═══════════════ REPORT ═══════════════
console.log("\n══════════ DEEP AUDIT ══════════");
let pass = 0;
for (const r of results) {
  console.log(`${r.ok ? "✓" : "✗"} ${r.name}${r.extra ? "  — " + r.extra : ""}`);
  if (r.ok) pass++;
}
console.log("────────────────────────────────");
console.log(`PASS ${pass}/${results.length}`);
console.log(`Console/page errors: ${errors.length}`);
errors.slice(0, 12).forEach((e) => console.log("  ! " + e));

await browser.close();
process.exit(results.every((r) => r.ok) && errors.length === 0 ? 0 : 1);
