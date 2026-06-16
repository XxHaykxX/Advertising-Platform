import { chromium } from "playwright";
const b = await chromium.launch();
const errors = [];
const p = await b.newPage({ viewport: { width: 1366, height: 900 } });
p.on("console", (m) => m.type() === "error" && errors.push(m.text()));
p.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

await p.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await p.evaluate(() => document.querySelector("footer")?.scrollIntoView());
await p.waitForTimeout(700);
const footerLinks = await p.locator("footer a").count();
await p.locator("footer").screenshot({ path: "scripts/footer.png" });

await p.goto("http://localhost:3000/privacy", { waitUntil: "networkidle" });
await p.waitForTimeout(500);
const privacyH1 = await p.locator("h1").innerText();
await p.screenshot({ path: "scripts/privacy.png" });

await p.goto("http://localhost:3000/consent", { waitUntil: "networkidle" });
await p.waitForTimeout(400);
const consentH1 = await p.locator("h1").innerText();

console.log(JSON.stringify({ footerLinks, privacyH1, consentH1, errors }, null, 2));
await b.close();
