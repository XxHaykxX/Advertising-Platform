// Usage: node scripts/gen-image.mjs <outPath> "<prompt>" [refImg1 refImg2 ...]
import fs from "node:fs";

const [, , outPath, prompt, ...refs] = process.argv;
if (!outPath || !prompt) {
  console.error('Usage: node scripts/gen-image.mjs <outPath> "<prompt>" [refImg ...]');
  process.exit(1);
}

const env = fs.readFileSync(".env", "utf8");
const key = (env.match(/^GOOGLE_API_KEY="?([^"\n]+)"?/m) || [])[1];
if (!key) { console.error("No GOOGLE_API_KEY in .env"); process.exit(1); }

const MODEL = "gemini-3-pro-image"; // Nano Banana Pro
const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;

const parts = [];
for (const r of refs) {
  if (fs.existsSync(r)) {
    const b64 = fs.readFileSync(r).toString("base64");
    const mime = r.endsWith(".png") ? "image/png" : "image/jpeg";
    parts.push({ inlineData: { mimeType: mime, data: b64 } });
  }
}
parts.push({ text: prompt });

const body = {
  contents: [{ parts }],
  generationConfig: {
    responseModalities: ["IMAGE"],
    imageConfig: { aspectRatio: "16:9", imageSize: "4K" },
  },
};

let res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
let json = await res.json();

// retry without imageSize if the param is rejected
if (!res.ok && /imageSize|image_size|imageConfig/i.test(JSON.stringify(json))) {
  body.generationConfig.imageConfig = { aspectRatio: "16:9" };
  res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  json = await res.json();
  console.error("(note: 4K param rejected, fell back to default size)");
}
if (!res.ok) { console.error("HTTP", res.status, JSON.stringify(json).slice(0, 500)); process.exit(1); }

const imgPart = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
if (!imgPart) { console.error("No image:", JSON.stringify(json).slice(0, 600)); process.exit(1); }
fs.mkdirSync(outPath.replace(/[/\\][^/\\]+$/, ""), { recursive: true });
fs.writeFileSync(outPath, Buffer.from(imgPart.inlineData.data, "base64"));
console.log("saved", outPath, fs.statSync(outPath).size, "bytes");
