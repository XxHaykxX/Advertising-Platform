import { chromium } from "playwright";
import fs from "node:fs";
const browser = await chromium.connectOverCDP("http://localhost:9222");
let page=null;
for (const c of browser.contexts()) for (const pg of c.pages()) if (/kinodaran/i.test(pg.url())) page=pg;
if(!page){ console.log("no kinodaran tab"); process.exit(1); }
for(let i=0;i<10;i++){ await page.mouse.wheel(0,1400); await page.waitForTimeout(500); }
await page.waitForTimeout(1000);
let urls = await page.evaluate(()=>[...document.querySelectorAll("img")].map(i=>i.currentSrc||i.src).filter(s=>/cdn\.kinodaran\.com\/MEDIA\/.*thumbnail/i.test(s)));
// dedupe by movie id
const seen=new Set(); const pick=[];
for(const u of urls){ const id=(u.match(/(MOVIE|TV_SHOW)\/(\d+)/)||[])[2]||u; if(!seen.has(id)){seen.add(id); pick.push(u);} }
console.log("distinct thumbnails:", pick.length);
const stage="public/posters-stage"; fs.rmSync(stage,{recursive:true,force:true}); fs.mkdirSync(stage,{recursive:true});
const req = page.context().request;
let n=0;
for(const u of pick.slice(0,24)){
  try{ const r=await req.get(u); if(!r.ok()){console.log("skip",r.status());continue;} const buf=Buffer.from(await r.body());
    if(buf.length<3000)continue; n++; fs.writeFileSync(`${stage}/poster-${String(n).padStart(2,"0")}.jpg`, buf);
  }catch(e){console.log("err",e.message);}
}
console.log("downloaded:", n, "→", stage);
await browser.close();
