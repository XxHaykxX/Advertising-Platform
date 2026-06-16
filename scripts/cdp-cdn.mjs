import { chromium } from "playwright";
const browser = await chromium.connectOverCDP("http://localhost:9222");
let page=null;
for (const c of browser.contexts()) for (const pg of c.pages()) { if (/kinodaran/i.test(pg.url())) { page=pg; } }
if(!page){ console.log("no kinodaran tab"); process.exit(0); }
console.log("url:", page.url());
console.log("password field present (NOT logged in if 1):", await page.locator('input[type=password]').count());
const cdn = await page.evaluate(()=>[...document.querySelectorAll("img")].map(i=>({src:i.currentSrc||i.src,w:i.naturalWidth,h:i.naturalHeight})).filter(x=>/cdn\.kinodaran/i.test(x.src)));
console.log("cdn imgs:", cdn.length);
[...new Set(cdn.map(x=>`${x.w}x${x.h} ${x.src}`))].slice(0,40).forEach(s=>console.log(s.slice(0,140)));
await browser.close();
