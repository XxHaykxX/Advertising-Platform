import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1366, height: 1200 } });
try {
  await p.goto("https://dribbble.com/shots/25445307-Lapz-Website-Scrolling-Hero-Animation", { waitUntil: "networkidle", timeout: 45000 });
} catch(e){ console.log("nav warn:", e.message); }
await p.waitForTimeout(3500);
const title = await p.title();
await p.screenshot({ path: "scripts/dribbble.png", fullPage: false });
console.log("title:", title);
await b.close();
