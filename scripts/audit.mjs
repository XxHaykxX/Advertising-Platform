import { chromium } from "playwright";

const bugs = [];
const note = (sev, where, msg) => bugs.push({ sev, where, msg });

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1366, height: 900 } });
const consoleErrors = [];
p.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
p.on("pageerror", (e) => consoleErrors.push("PAGEERROR: " + e.message));

await p.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await p.waitForTimeout(800);

// ── 1. Sections present ───────────────────────────────────
for (const id of ["how", "catalog", "portfolio", "partners", "contact"]) {
  const ok = await p.locator(`#${id}`).count();
  if (!ok) note("HIGH", "sections", `#${id} missing`);
}

// ── 2. Header nav anchors scroll ──────────────────────────
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(400);
for (const label of ["Каталог", "Портфолио", "Партнёры", "Контакты"]) {
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.waitForTimeout(500);
  const before = await p.evaluate(() => window.scrollY);
  const link = p.locator(`header nav a:has-text("${label}")`).first();
  const exists = await link.count();
  if (!exists) { note("HIGH", "header-nav", `nav link "${label}" not found`); continue; }
  await link.click();
  await p.waitForTimeout(1400);
  const after = await p.evaluate(() => window.scrollY);
  if (Math.abs(after - before) < 50) note("MED", "header-nav", `"${label}" did not scroll (Δ=${after - before})`);
}

// ── 3. Catalog: each card opens modal with the SAME title ──
await p.evaluate(() => document.querySelector("#catalog")?.scrollIntoView());
await p.waitForTimeout(900);
const cardTitles = await p.locator("#catalog article h3").allInnerTexts();
note("INFO", "catalog", `cards: ${cardTitles.length} → ${cardTitles.join(", ")}`);

for (let i = 0; i < cardTitles.length; i++) {
  const title = cardTitles[i];
  const card = p.locator("#catalog article").nth(i);
  await card.scrollIntoViewIfNeeded();
  await p.waitForTimeout(200);
  // click the title (card body, not the CTA button)
  await card.locator("h3").click();
  await p.waitForTimeout(450);
  const modal = p.locator("div.fixed", { hasText: "Оставить заявку на этот проект" });
  const open = await modal.count();
  if (!open) {
    note("HIGH", "catalog-modal", `card "${title}" click did NOT open modal`);
    continue;
  }
  const modalTitle = (await modal.locator("h3").first().innerText().catch(() => "")).trim();
  if (modalTitle !== title) {
    note("HIGH", "catalog-modal", `card "${title}" → modal shows "${modalTitle}" (MISMATCH)`);
  }
  if (i === 0 || i === 3) await p.screenshot({ path: `scripts/audit-card-${i}.png` });
  await p.keyboard.press("Escape");
  await p.waitForTimeout(350);
  const stillOpen = await p.locator("div.fixed", { hasText: "Оставить заявку на этот проект" }).count();
  if (stillOpen) note("MED", "catalog-modal", `Esc did not close modal for "${title}"`);
}

// ── 3.5 Modal scroll-lock: background must NOT move behind modal ──
await p.evaluate(() => document.querySelector("#catalog")?.scrollIntoView());
await p.waitForTimeout(600);
await p.locator("#catalog article").first().locator("h3").click();
await p.waitForTimeout(450);
const yLocked1 = await p.evaluate(() => window.scrollY);
await p.mouse.move(683, 450);
await p.mouse.wheel(0, 800);
await p.waitForTimeout(900);
const yLocked2 = await p.evaluate(() => window.scrollY);
if (Math.abs(yLocked1 - yLocked2) > 30) note("HIGH", "modal-scroll-lock", `background scrolled behind modal (Δ=${yLocked2 - yLocked1})`);
await p.keyboard.press("Escape");
await p.waitForTimeout(400);

// ── 4. Catalog: card CTA should NOT open modal, should autofill contact ──
await p.evaluate(() => document.querySelector("#catalog")?.scrollIntoView());
await p.waitForTimeout(600);
const firstCardTitle = cardTitles[0];
const ctaBtn = p.locator('#catalog article button:has-text("Оставить заявку")').first();
await ctaBtn.scrollIntoViewIfNeeded();
await ctaBtn.click();
await p.waitForTimeout(1200);
const modalAfterCta = await p.locator("div.fixed", { hasText: "Оставить заявку на этот проект" }).count();
if (modalAfterCta) note("MED", "catalog-cta", `card CTA opened the modal (should only scroll to contact)`);
const selectVal = await p.locator('#contact select[name="project"]').inputValue().catch(() => "");
if (selectVal !== firstCardTitle) note("MED", "catalog-cta", `project autofill: select="${selectVal}" expected "${firstCardTitle}"`);

// ── 5. Catalog filters ────────────────────────────────────
await p.locator('#catalog input[placeholder^="Поиск"]').fill("город");
await p.waitForTimeout(500);
const found = await p.locator("#catalog article").count();
if (found !== 1) note("MED", "catalog-filter", `search "город" → ${found} cards (expected 1)`);
await p.locator('#catalog input[placeholder^="Поиск"]').fill("");
await p.waitForTimeout(300);

// ── 6. Portfolio lightbox ─────────────────────────────────
await p.evaluate(() => document.querySelector("#portfolio")?.scrollIntoView());
await p.waitForTimeout(800);
await p.locator("#portfolio button.group").first().click();
await p.waitForTimeout(600);
const lb = await p.locator("div.fixed", { hasText: "×" }).count();
const lbThumbs = await p.locator("div.fixed img").count();
if (lbThumbs < 1) note("MED", "portfolio", "lightbox opened but no media visible");
await p.keyboard.press("Escape");
await p.waitForTimeout(300);

// ── 7. Contact submit (real POST) ─────────────────────────
await p.evaluate(() => document.querySelector("#contact")?.scrollIntoView());
await p.waitForTimeout(500);
await p.locator('#contact input[name="name"]').fill("Аудит Тест");
await p.locator('#contact input[name="phone"]').fill("+79990009988");
await p.locator('#contact input[type="checkbox"]').check();
await p.locator('#contact button[type="submit"]').click();
await p.waitForTimeout(1500);
const success = await p.locator("text=Заявка отправлена").count();
if (!success) note("HIGH", "contact", "valid submit did NOT reach success state");

// ── done ──────────────────────────────────────────────────
if (consoleErrors.length) note("HIGH", "console", `${consoleErrors.length} errors: ${consoleErrors.slice(0, 5).join(" | ")}`);

console.log("\n================ AUDIT RESULT ================");
if (bugs.length === 0) console.log("No issues found.");
for (const x of bugs) console.log(`[${x.sev}] ${x.where}: ${x.msg}`);
console.log("=============================================\n");
await b.close();
