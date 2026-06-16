import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const PASS = process.env.ADMIN_PASSWORD || "admin1234";

let passed = 0;
let failed = 0;

function check(label, value) {
  if (value) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.log(`  ✗ ${label}`);
    failed++;
  }
}

const browser = await chromium.launch();

// ── Shared admin context ──────────────────────────────────────────────────────
const adminCtx = await browser.newContext();
const admin = await adminCtx.newPage();
admin.on("dialog", (d) => d.accept());

async function loginAdmin() {
  await admin.goto(`${BASE}/admin/login`, { waitUntil: "networkidle" });
  await admin.fill('input[name="password"]', PASS);
  await admin.click('button[type="submit"]');
  await admin.waitForURL(`${BASE}/admin`, { timeout: 20000 }).catch(() => {});
}

await loginAdmin();

// ════════════════════════════════════════════════════════════════════════════════
// TEST 1 — Default site language
// ════════════════════════════════════════════════════════════════════════════════
console.log("\n[1] Default site language");

async function setDefaultLang(lang) {
  await admin.goto(`${BASE}/admin/settings`, { waitUntil: "networkidle" });
  // select the desired lang
  await admin.selectOption('select[name="default_lang"]', lang);
  // submit — look for the Сохранить button inside the lang form (max-w-xs)
  await admin.locator("form.max-w-xs button[type='submit']").click();
  // wait for success indicator
  await admin.waitForSelector("text=Сохранено", { timeout: 10000 }).catch(() => {});
  await admin.waitForTimeout(500);
}

// Set English as default
await setDefaultLang("en");

// Fresh context — no cookies
const freshEn = await browser.newContext();
const pageEn = await freshEn.newPage();
await pageEn.goto(`${BASE}/`, { waitUntil: "networkidle" });
const langEn = await pageEn.getAttribute("html", "lang");
await freshEn.close();

check("fresh context sees lang='en' after setting default=en", langEn === "en");

// Restore Russian
await setDefaultLang("ru");

const freshRu = await browser.newContext();
const pageRu = await freshRu.newPage();
await pageRu.goto(`${BASE}/`, { waitUntil: "networkidle" });
const langRu = await pageRu.getAttribute("html", "lang");
await freshRu.close();

check("fresh context sees lang='ru' after restoring default=ru", langRu === "ru");

// ════════════════════════════════════════════════════════════════════════════════
// TEST 2 — Actor / Scene i18n fields
// ════════════════════════════════════════════════════════════════════════════════
console.log("\n[2] Actor / Scene i18n fields on project 1");

// Navigate to project 1 edit page
await admin.goto(`${BASE}/admin/projects/1/edit`, { waitUntil: "networkidle" });
await admin.waitForTimeout(500);

// ── Actor block — expand EN/HY details and fill Role EN ──────────────────────
// The first actor card is a div with the EN/HY details inside it
const firstActorCard = admin.locator(
  "section:has(h2:text('Актёры')) > div.flex.items-start",
).first();

// Expand the EN/HY details inside the first actor card
const actorDetails = firstActorCard.locator("details").first();
const actorDetailsOpen = await actorDetails.getAttribute("open");
if (actorDetailsOpen === null) {
  await actorDetails.locator("summary").click();
  await admin.waitForTimeout(300);
}

// Fill Role EN
const roleEnInput = actorDetails.locator('input[placeholder="Role EN"]');
await roleEnInput.fill("Lead EN-Test");

// ── Scene block — expand EN/HY details and fill Title EN ─────────────────────
const firstSceneCard = admin.locator(
  "section:has(h2:text('Сцены для плейсмента')) > div.space-y-2",
).first();

const sceneDetails = firstSceneCard.locator("details").first();
const sceneDetailsOpen = await sceneDetails.getAttribute("open");
if (sceneDetailsOpen === null) {
  await sceneDetails.locator("summary").click();
  await admin.waitForTimeout(300);
}

// Fill Title EN
const titleEnInput = sceneDetails.locator('input[placeholder="Title EN"]');
await titleEnInput.fill("Scene EN-Test");

// Save form
await admin.click('button:has-text("Сохранить")');
await admin.waitForURL(`${BASE}/admin/projects`, { timeout: 20000 });
await admin.waitForTimeout(500);

check("save after filling EN fields navigated back to /admin/projects", admin.url().includes("/admin/projects"));

// ── Check EN locale on public page ───────────────────────────────────────────
const enCtx = await browser.newContext({
  storageState: undefined,
});
// Set locale cookie to en
await enCtx.addCookies([
  { name: "locale", value: "en", domain: "localhost", path: "/" },
]);
const enPage = await enCtx.newPage();
await enPage.goto(`${BASE}/projects/1`, { waitUntil: "networkidle" });
await enPage.waitForTimeout(500);

const bodyTextEn = await enPage.locator("body").innerText();
const hasActorEn = bodyTextEn.includes("Lead EN-Test");
const hasSceneEn = bodyTextEn.includes("Scene EN-Test");

check("EN locale shows 'Lead EN-Test' for actor role", hasActorEn);
check("EN locale shows 'Scene EN-Test' for scene title", hasSceneEn);

await enCtx.close();

// ── Check RU locale shows Russian values (NOT EN-test strings) ───────────────
const ruCtx = await browser.newContext();
await ruCtx.addCookies([
  { name: "locale", value: "ru", domain: "localhost", path: "/" },
]);
const ruPage = await ruCtx.newPage();
await ruPage.goto(`${BASE}/projects/1`, { waitUntil: "networkidle" });
await ruPage.waitForTimeout(500);

const bodyTextRu = await ruPage.locator("body").innerText();
const noActorEnInRu = !bodyTextRu.includes("Lead EN-Test");
const noSceneEnInRu = !bodyTextRu.includes("Scene EN-Test");

check("RU locale does NOT show 'Lead EN-Test'", noActorEnInRu);
check("RU locale does NOT show 'Scene EN-Test'", noSceneEnInRu);

await ruCtx.close();

// ── Cleanup — clear EN fields ─────────────────────────────────────────────────
console.log("\n[2c] Cleanup — clearing EN test values");

await admin.goto(`${BASE}/admin/projects/1/edit`, { waitUntil: "networkidle" });
await admin.waitForTimeout(500);

// Expand actor EN/HY details
const firstActorCard2 = admin.locator(
  "section:has(h2:text('Актёры')) > div.flex.items-start",
).first();
const actorDetails2 = firstActorCard2.locator("details").first();
const actorDetails2Open = await actorDetails2.getAttribute("open");
if (actorDetails2Open === null) {
  await actorDetails2.locator("summary").click();
  await admin.waitForTimeout(300);
}
await actorDetails2.locator('input[placeholder="Role EN"]').fill("");

// Expand scene EN/HY details
const firstSceneCard2 = admin.locator(
  "section:has(h2:text('Сцены для плейсмента')) > div.space-y-2",
).first();
const sceneDetails2 = firstSceneCard2.locator("details").first();
const sceneDetails2Open = await sceneDetails2.getAttribute("open");
if (sceneDetails2Open === null) {
  await sceneDetails2.locator("summary").click();
  await admin.waitForTimeout(300);
}
await sceneDetails2.locator('input[placeholder="Title EN"]').fill("");

// Save cleanup
await admin.click('button:has-text("Сохранить")');
await admin.waitForURL(`${BASE}/admin/projects`, { timeout: 20000 });
await admin.waitForTimeout(500);

check("cleanup save navigated back to /admin/projects", admin.url().includes("/admin/projects"));

// ── Verify EN fallback to RU after clearing EN fields ────────────────────────
const enCtx2 = await browser.newContext();
await enCtx2.addCookies([
  { name: "locale", value: "en", domain: "localhost", path: "/" },
]);
const enPage2 = await enCtx2.newPage();
await enPage2.goto(`${BASE}/projects/1`, { waitUntil: "networkidle" });
await enPage2.waitForTimeout(500);

const bodyTextEn2 = await enPage2.locator("body").innerText();
const noEnTestActor = !bodyTextEn2.includes("Lead EN-Test");
const noEnTestScene = !bodyTextEn2.includes("Scene EN-Test");

check("after cleanup: EN locale no longer shows 'Lead EN-Test' (RU fallback)", noEnTestActor);
check("after cleanup: EN locale no longer shows 'Scene EN-Test' (RU fallback)", noEnTestScene);

await enCtx2.close();

// ════════════════════════════════════════════════════════════════════════════════
console.log(`\n──────────────────────────────────`);
console.log(`Result: ${passed} passed, ${failed} failed`);

await browser.close();

if (failed > 0) process.exit(1);
