import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const urls = new Set();
p.on("response", (r) => {
  const u = r.url();
  if (/\.(jpe?g|png|webp)(\?|$)/i.test(u)) urls.add(u);
});
try { await p.goto("https://kinodaran.com/", { waitUntil: "networkidle", timeout: 45000 }); }
catch(e){ console.log("nav warn", e.message); }
// scroll to trigger lazy load
for (let i=0;i<8;i++){ await p.mouse.wheel(0,1200); await p.waitForTimeout(700); }
await p.waitForTimeout(1500);
// also collect from <img> with natural size
const imgs = await p.evaluate(() => [...document.querySelectorAll("img")].map(i => ({src:i.currentSrc||i.src, w:i.naturalWidth, h:i.naturalHeight, alt:i.alt})).filter(x=>x.src));
await b.close();
const big = imgs.filter(x => x.w>=150 && x.h>=200); // poster-ish aspect/size
console.log("=== network image urls:", urls.size);
console.log("=== <img> >=150x200:", big.length);
big.slice(0,40).forEach(x=>console.log(`${x.w}x${x.h}  ${x.alt?.slice(0,20)||''}  ${x.src.slice(0,90)}`));
console.log("--- sample network urls ---");
[...urls].slice(0,15).forEach(u=>console.log(u.slice(0,100)));
