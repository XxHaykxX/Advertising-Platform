import { chromium } from "playwright";
const b = await chromium.launch();
const errors = [];
const p = await b.newPage({ viewport: { width: 1366, height: 760 } });
p.on("console", (m) => m.type() === "error" && errors.push(m.text()));
p.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
await p.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await p.evaluate(() => document.querySelector("#partners")?.scrollIntoView());
await p.waitForTimeout(1000);

const rows = await p.locator("#partners .marquee-row").count();
const chips = await p.locator("#partners a.group\\/chip").count();

// confirm marquee moves: sample first chip x twice
const chip = p.locator("#partners .marquee-x a").first();
const x1 = (await chip.boundingBox())?.x ?? 0;
await p.waitForTimeout(1500);
const x2 = (await chip.boundingBox())?.x ?? 0;

await p.locator("#partners").screenshot({ path: "scripts/partners-full.png" });
console.log(JSON.stringify({ rows, chips, moved: Math.abs(x1 - x2) > 1, dx: +(x2 - x1).toFixed(1), errors }, null, 2));
await b.close();
