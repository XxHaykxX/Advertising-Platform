import { chromium } from "playwright";
const b = await chromium.launch();
const errors = [];
const p = await b.newPage({ viewport: { width: 1366, height: 850 } });
p.on("console", (m) => m.type() === "error" && errors.push(m.text()));
p.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
await p.goto("http://localhost:3000/hero-scroll", { waitUntil: "networkidle" });
await p.waitForTimeout(3500); // preload frames
await p.screenshot({ path: "scripts/scrub-top.png" });
await p.mouse.move(683, 425);
for (let i = 0; i < 14; i++) { await p.mouse.wheel(0, 500); await p.waitForTimeout(220); }
await p.waitForTimeout(1000);
await p.screenshot({ path: "scripts/scrub-mid.png" });
console.log(JSON.stringify({ errors }, null, 2));
await b.close();
