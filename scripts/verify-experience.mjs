import { chromium } from "playwright";
const b = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"] });
const errors = [];
const p = await b.newPage({ viewport: { width: 1366, height: 850 } });
p.on("console", (m) => m.type() === "error" && errors.push(m.text()));
p.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
await p.goto("http://localhost:3000/experience", { waitUntil: "networkidle" });
await p.waitForTimeout(3500); // textures + first frames
const hasCanvas = await p.locator("canvas").count();
await p.screenshot({ path: "scripts/exp-top.png" });
// scroll the 3D (ScrollControls owns the wheel)
await p.mouse.move(683, 425);
for (let i = 0; i < 8; i++) { await p.mouse.wheel(0, 500); await p.waitForTimeout(250); }
await p.waitForTimeout(1200);
await p.screenshot({ path: "scripts/exp-scrolled.png" });
console.log(JSON.stringify({ hasCanvas, errors: errors.slice(0,6) }, null, 2));
await b.close();
