import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const PASS = process.env.ADMIN_PASSWORD || "admin1234";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgYGAAAAAEAAH2FzhVAAAAAElFTkSuQmCC",
  "base64",
);

const browser = await chromium.launch();

// 1. unauthenticated → 401
const anon = await browser.newContext();
const r401 = await anon.request.post(`${BASE}/api/admin/upload`, {
  multipart: {
    file: { name: "x.png", mimeType: "image/png", buffer: PNG },
    type: "misc",
  },
});
console.log("anon upload status:", r401.status(), "(expect 401)");

// 2. authenticated → 200 + path
const ctx = await browser.newContext();
const page = await ctx.newPage();
await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle" });
await page.fill('input[name="password"]', PASS);
await page.click('button[type="submit"]');
await page.waitForURL(`${BASE}/admin`, { timeout: 20000 }).catch(() => {});

const up = await ctx.request.post(`${BASE}/api/admin/upload`, {
  multipart: {
    file: { name: "test.png", mimeType: "image/png", buffer: PNG },
    type: "misc",
  },
});
const body = await up.json().catch(() => ({}));
console.log("auth upload status:", up.status(), "path:", body.path);

// 3. uploaded file is served
let served = 0;
if (body.path) {
  const got = await ctx.request.get(`${BASE}${body.path}`);
  served = got.status();
}
console.log("served file status:", served, "(expect 200)");

// 4. reject bad type
const bad = await ctx.request.post(`${BASE}/api/admin/upload`, {
  multipart: {
    file: { name: "x.txt", mimeType: "text/plain", buffer: Buffer.from("hi") },
    type: "misc",
  },
});
console.log("bad-type status:", bad.status(), "(expect 415)");

await browser.close();
