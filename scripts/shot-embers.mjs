import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1366, height: 850 }, deviceScaleFactor: 2 });
await p.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await p.mouse.move(683, 425);
// scroll so the section heading / top sits in view
for (let i = 0; i < 4; i++) { await p.mouse.wheel(0, 500); await p.waitForTimeout(400); }
await p.waitForTimeout(1200);
const emberCount = await p.locator("#how .bg-primary.rounded-full").count();
await p.screenshot({ path: "scripts/embers-view.png" });
console.log(JSON.stringify({ emberCount }));
await b.close();
