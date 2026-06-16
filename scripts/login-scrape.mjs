import { chromium } from "playwright";
const EMAIL = process.env.KINO_EMAIL, PASS = process.env.KINO_PASS;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const imgUrls = new Set();
p.on("response", async (r) => {
  const u = r.url(), ct = r.headers()["content-type"]||"";
  if (/\.(jpe?g|png|webp)(\?|$)/i.test(u)) imgUrls.add(u);
  if (/json/i.test(ct)) { try { const t=await r.text(); (t.match(/https?:\/\/[^"' )]+\.(?:jpe?g|png|webp)/gi)||[]).forEach(x=>imgUrls.add(x)); } catch{} }
});

await p.goto("https://kinodaran.com/", { waitUntil: "networkidle", timeout: 45000 }).catch(()=>{});
// find login entry
let opened = false;
for (const t of ["Войти","Вход","Login","Sign in","Личный кабинет","Кабинет"]) {
  const el = p.locator(`text=${t}`).first();
  if (await el.count()) { await el.click().catch(()=>{}); await p.waitForTimeout(1500); opened=true; break; }
}
if (!opened) { for (const r of ["/login","/signin","/auth/login","/sign-in"]) { await p.goto("https://kinodaran.com"+r,{waitUntil:"networkidle",timeout:20000}).catch(()=>{}); if (await p.locator('input[type="password"]').count()) break; } }
await p.waitForTimeout(1000);

const email = p.locator('input[type="email"], input[name*="email" i], input[name*="login" i]').first();
const pass = p.locator('input[type="password"]').first();
console.log("login form found:", await email.count(), await pass.count());
if (await pass.count()) {
  await email.fill(EMAIL).catch(()=>{});
  await pass.fill(PASS).catch(()=>{});
  const btn = p.locator('button[type="submit"], button:has-text("Войти"), button:has-text("Вход"), button:has-text("Login")').first();
  await btn.click().catch(()=>{});
  await p.waitForTimeout(5000);
}
console.log("after-login URL:", p.url());
console.log("password still visible (login failed?):", await p.locator('input[type="password"]').count());
const captcha = await p.locator('iframe[src*="recaptcha"]').count();
console.log("recaptcha present:", captcha);

// scroll for lazy posters
for (let i=0;i<10;i++){ await p.mouse.wheel(0,1500); await p.waitForTimeout(600); }
await p.waitForTimeout(1500);
await p.screenshot({ path:"scripts/kino-after.png" });
const imgs = await p.evaluate(()=>[...document.querySelectorAll("img")].map(i=>({src:i.currentSrc||i.src,w:i.naturalWidth,h:i.naturalHeight})).filter(x=>x.src&&x.w>=140&&x.h>=180));
await b.close();
console.log("=== poster-sized <img>:", imgs.length);
imgs.slice(0,50).forEach(x=>console.log(`${x.w}x${x.h} ${x.src.slice(0,110)}`));
console.log("=== network image urls:", imgUrls.size);
[...imgUrls].slice(0,40).forEach(u=>console.log(u.slice(0,110)));
