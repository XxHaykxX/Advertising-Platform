import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const browser = await chromium.launch();
const results = [];
const ok = (n, c, e = "") => results.push({ n, ok: !!c, e });

async function ctxFor(loc, w, h) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  await ctx.addCookies([{ name: "locale", value: loc, url: BASE }]);
  return ctx;
}
async function noHOverflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 2);
}
async function inViewport(page, locator) {
  const box = await locator.boundingBox();
  if (!box) return false;
  const vw = page.viewportSize().width;
  return box.x >= -2 && box.x + box.width <= vw + 2 && box.width > 10;
}

// ── desktop 1366: clickability per locale ──
for (const loc of ["ru", "en", "hy"]) {
  const ctx = await ctxFor(loc, 1366, 850);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  ok(`[${loc}] home no h-overflow`, await noHOverflow(page));
  // CTA in header visible & inside viewport (not clipped)
  const cta = page.locator("header a.rounded-full.bg-primary").first();
  ok(`[${loc}] header CTA in viewport`, await inViewport(page, cta));
  // click a nav item → scrolls to section (url hash or section in view)
  const navItem = page.locator("header nav a").nth(1); // Каталог/Catalog/Կատալոգ
  await navItem.click();
  await page.waitForTimeout(900);
  const catVisible = await page.locator("#catalog").isVisible();
  ok(`[${loc}] nav click scrolls to catalog`, catVisible);
  // CTA click → contact section
  await page.locator("header a.rounded-full.bg-primary").first().click();
  await page.waitForTimeout(900);
  ok(`[${loc}] CTA click reaches contact`, await page.locator("#contact").isVisible());

  // project detail overflow + apply
  await page.goto(`${BASE}/projects/1`, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  ok(`[${loc}] detail no h-overflow`, await noHOverflow(page));
  const applyBtn = page.locator("aside button").first();
  ok(`[${loc}] detail apply in viewport`, await inViewport(page, applyBtn));
  await applyBtn.click();
  await page.waitForTimeout(600);
  ok(`[${loc}] detail apply modal opens`, (await page.locator('input[name="name"]').count()) > 0);
  await ctx.close();
}

// ── mobile 375 hy: burger menu ──
{
  const ctx = await ctxFor("hy", 375, 800);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  ok("[hy mobile] home no h-overflow", await noHOverflow(page));
  await page.getByRole("button", { name: /Открыть меню|Open menu|menu/i }).first().click().catch(async () => {
    await page.locator("header button").last().click();
  });
  await page.waitForTimeout(700);
  ok("[hy mobile] burger nav item", (await page.getByText("Ինչպես է աշխատում").count()) > 0);
  ok("[hy mobile] burger CTA", (await page.getByText("Թողնել հայտ").count()) > 0);
  ok("[hy mobile] burger lang switch", (await page.getByRole("button", { name: "HY", exact: true }).count()) > 0);
  await ctx.close();
}

// ── catalog filter bar overflow in hy at laptop ──
{
  const ctx = await ctxFor("hy", 1100, 800);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  ok("[hy laptop] no h-overflow", await noHOverflow(page));
  const burgerVisible = await page.locator("header button").last().isVisible();
  ok("[hy laptop] burger shown (nav collapsed)", burgerVisible);
  await ctx.close();
}

console.log("\n══════ I18N UX / LAYOUT ══════");
let pass = 0;
for (const r of results) { console.log(`${r.ok ? "✓" : "✗"} ${r.n}${r.e ? " — " + r.e : ""}`); if (r.ok) pass++; }
console.log("──────────────────────────────");
console.log(`PASS ${pass}/${results.length}`);
await browser.close();
process.exit(results.every((r) => r.ok) ? 0 : 1);
