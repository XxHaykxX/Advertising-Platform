import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const browser = await chromium.launch();
const ctx = await browser.newContext();
await ctx.addCookies([{ name: "locale", value: "en", url: BASE }]);
const page = await ctx.newPage();

const results = [];
const ok = (name, cond, extra = "") => results.push({ name, ok: !!cond, extra });

// Chrome RU strings that MUST be gone in EN (data like genres may stay RU — not checked)
const HOME_RU = ["Подробнее", "Доступно ", "Выход:", "мало мест", "Наведите на ленту", "Шаг ", "видео", "Интересующий проект", "Сообщение", "Отправить заявку", "Найдено проектов:", "Цена по запросу"];
const DETAIL_RU = ["К каталогу", "О проекте", "Актёры", "Сцены для плейсмента", "Возможный плейсмент", "Кадры", "Слоты", "Выход", "Дедлайн", "Площадки", "Цена", "по запросу", "Оставить заявку"];

async function leftover(strings) {
  const body = await page.locator("body").innerText();
  return strings.filter((s) => body.includes(s));
}

// HOME in EN
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
ok("home html lang en", (await page.getAttribute("html", "lang")) === "en");
ok("EN hero subtitle", (await page.getByText("A showcase of films still in production").count()) > 0);
ok("EN card 'Details'", (await page.getByText("Details").first().count()) > 0);
const homeLeft = await leftover(HOME_RU);
ok("home: no RU chrome leftover", homeLeft.length === 0, homeLeft.join(" | "));

// PROJECT DETAIL in EN
await page.goto(`${BASE}/projects/1`, { waitUntil: "networkidle" });
ok("EN detail 'About the project'", (await page.getByText("About the project").count()) > 0);
ok("EN detail 'Cast'", (await page.getByText("Cast").first().count()) > 0);
ok("EN detail 'Apply now'", (await page.getByText("Apply now").count()) > 0);
const detailLeft = await leftover(DETAIL_RU);
ok("detail: no RU chrome leftover", detailLeft.length === 0, detailLeft.join(" | "));

// apply modal EN
await page.getByRole("button", { name: "Apply now" }).first().click();
await page.waitForTimeout(600);
ok("modal EN 'Project of interest'", (await page.getByText("Project of interest").count()) > 0);
ok("modal EN 'Send request'", (await page.getByText("Send request").count()) > 0);

// HY smoke
await ctx.clearCookies();
await ctx.addCookies([{ name: "locale", value: "hy", url: BASE }]);
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
ok("HY html lang", (await page.getAttribute("html", "lang")) === "hy");
ok("HY catalog heading", (await page.getByText("Ապագա ֆիլմեր").count()) > 0);

console.log("\n══════ I18N COVERAGE ══════");
let pass = 0;
for (const r of results) {
  console.log(`${r.ok ? "✓" : "✗"} ${r.name}${r.extra ? "  — LEFTOVER: " + r.extra : ""}`);
  if (r.ok) pass++;
}
console.log("───────────────────────────");
console.log(`PASS ${pass}/${results.length}`);

await browser.close();
process.exit(results.every((r) => r.ok) ? 0 : 1);
