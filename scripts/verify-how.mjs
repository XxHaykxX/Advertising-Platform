import { chromium } from "playwright";

const b = await chromium.launch();
const errors = [];
const p = await b.newPage({ viewport: { width: 1366, height: 850 } });
p.on("console", (m) => m.type() === "error" && errors.push(m.text()));
p.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
await p.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await p.waitForTimeout(700);

// Lenis-aware scroll: wheel through the whole section so reveals fire + line draws.
await p.mouse.move(683, 425);
for (let i = 0; i < 10; i++) {
  await p.mouse.wheel(0, 500);
  await p.waitForTimeout(450);
}
await p.waitForTimeout(800);

const cards = await p.locator("#how h3").count();

// Full section screenshot (all 3 steps + drawn line).
await p.locator("#how").screenshot({ path: "scripts/how-full.png" });

console.log(JSON.stringify({ cards, errors }, null, 2));
await b.close();
