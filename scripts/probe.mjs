import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const apiUrls = new Set();
const imgUrls = new Set();
p.on("response", async (r) => {
  const u = r.url(); const ct = (r.headers()["content-type"]||"");
  if (/\.(jpe?g|png|webp)(\?|$)/i.test(u)) imgUrls.add(u);
  if (/json/i.test(ct)) {
    apiUrls.add(u);
    try { const t = await r.text(); 
      const m = t.match(/https?:\/\/[^"' )]+\.(?:jpe?g|png|webp)/gi) || [];
      m.forEach(x=>imgUrls.add(x));
      const paths = t.match(/"(?:poster|image|img|cover|thumb|photo)[^"]*"\s*:\s*"([^"]+)"/gi) || [];
      paths.slice(0,8).forEach(x=>console.log("FIELD:", x.slice(0,120)));
    } catch{}
  }
});
async function visit(url){ try{ await p.goto(url,{waitUntil:"networkidle",timeout:30000}); }catch(e){console.log("warn",url,e.message);} for(let i=0;i<5;i++){await p.mouse.wheel(0,1500);await p.waitForTimeout(600);} await p.waitForTimeout(1000); }
for (const path of ["/","/films","/movies","/catalog","/projects","/home"]) {
  await visit("https://kinodaran.com"+path);
}
await b.close();
console.log("=== API json endpoints ===");[...apiUrls].slice(0,20).forEach(u=>console.log(u.slice(0,120)));
console.log("=== image urls found ===", imgUrls.size);[...imgUrls].slice(0,30).forEach(u=>console.log(u.slice(0,120)));
