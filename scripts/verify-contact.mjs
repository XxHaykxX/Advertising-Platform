import { chromium } from "playwright";
const b = await chromium.launch();
const errors = [];
const p = await b.newPage({ viewport: { width: 1366, height: 900 } });
p.on("console", (m) => m.type() === "error" && errors.push(m.text()));
p.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
await p.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await p.evaluate(() => document.querySelector("#contact")?.scrollIntoView());
await p.waitForTimeout(900);

const inputs = await p.locator("#contact input, #contact textarea, #contact select").count();
await p.locator("#contact").screenshot({ path: "scripts/contact-full.png" });

// validation: submit empty → should NOT show success
await p.locator('#contact button[type="submit"]').click();
await p.waitForTimeout(400);
const blockedEmpty = (await p.locator("text=Заявка отправлена").count()) === 0;

// fill valid + consent → submit → success
await p.locator('#contact input[name="name"]').fill("Тест Тестов");
await p.locator('#contact input[name="phone"]').fill("+79991234567");
await p.locator('#contact input[type="checkbox"]').check();
await p.locator('#contact button[type="submit"]').click();
await p.waitForTimeout(1300);
const success = await p.locator("text=Заявка отправлена").count();
await p.screenshot({ path: "scripts/contact-success.png" });

console.log(JSON.stringify({ inputs, blockedEmpty, success, errors }, null, 2));
await b.close();
