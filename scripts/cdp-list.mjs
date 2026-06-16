import { chromium } from "playwright";
const browser = await chromium.connectOverCDP("http://localhost:9222");
const ctxs = browser.contexts();
let page=null;
for (const c of ctxs) for (const pg of c.pages()) { if (/kinodaran/i.test(pg.url())) { page=pg; break; } }
if(!page){ console.log("no kinodaran tab. open tabs:"); for(const c of ctxs)for(const pg of c.pages())console.log(" -",pg.url()); process.exit(0); }
console.log("page:", page.url());
for(let i=0;i<12;i++){ await page.mouse.wheel(0,1400); await page.waitForTimeout(600); }
await page.waitForTimeout(1200);
const imgs = await page.evaluate(()=>[...document.querySelectorAll("img")].map(i=>({src:i.currentSrc||i.src,w:i.naturalWidth,h:i.naturalHeight,alt:i.alt})).filter(x=>x.src));
console.log("total imgs:", imgs.length);
const posters = imgs.filter(x=>x.w>=120 && x.h>=160 && x.h>=x.w*1.1); // portrait-ish
console.log("poster-ish:", posters.length);
posters.slice(0,60).forEach(x=>console.log(`${x.w}x${x.h} ${x.alt?.slice(0,18)||''} ${x.src.slice(0,100)}`));
console.log("--- all distinct hosts ---");
console.log([...new Set(imgs.map(x=>{try{return new URL(x.src).host}catch{return x.src.slice(0,20)}}))].join(", "));
await browser.close();
