import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1366, height: 800 }, deviceScaleFactor: 2 });
await p.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await p.mouse.move(683, 400);
await p.mouse.wheel(0, 400);
await p.waitForTimeout(1400);
// right cluster ~ x from 760..1366, top 0..90
await p.screenshot({ path: "scripts/cluster.png", clip: { x: 760, y: 0, width: 606, height: 90 } });
await b.close();
