// Veo image-to-video. Usage: node scripts/gen-video.mjs <startImage> <outMp4> "<prompt>"
import fs from "node:fs";

const [, , startImg, outMp4, prompt] = process.argv;
const env = fs.readFileSync(".env", "utf8");
const key = (env.match(/^GOOGLE_API_KEY="?([^"\n]+)"?/m) || [])[1];
if (!key) { console.error("no key"); process.exit(1); }

const MODEL = "veo-3.1-fast-generate-preview";
const base = "https://generativelanguage.googleapis.com/v1beta";

const imgB64 = fs.readFileSync(startImg).toString("base64");
const startBody = {
  instances: [
    { prompt, image: { bytesBase64Encoded: imgB64, mimeType: "image/png" } },
  ],
  parameters: { aspectRatio: "16:9" },
};

console.log("starting Veo job…");
let res = await fetch(`${base}/models/${MODEL}:predictLongRunning?key=${key}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(startBody),
});
let j = await res.json();
if (!res.ok) { console.error("START FAIL", res.status, JSON.stringify(j).slice(0, 800)); process.exit(2); }
const opName = j.name;
console.log("operation:", opName);

// poll
let done = null;
for (let i = 0; i < 40; i++) {
  await new Promise((r) => setTimeout(r, 8000));
  const pr = await fetch(`${base}/${opName}?key=${key}`);
  const pj = await pr.json();
  if (pj.error) { console.error("OP ERROR", JSON.stringify(pj.error).slice(0, 600)); process.exit(3); }
  if (pj.done) { done = pj; break; }
  process.stdout.write(`. (${(i + 1) * 8}s)`);
}
if (!done) { console.error("\ntimeout waiting for Veo"); process.exit(4); }
console.log("\ndone. keys:", JSON.stringify(Object.keys(done.response || {})));

// extract video uri (shape can vary)
const resp = done.response || {};
const sample =
  resp.generateVideoResponse?.generatedSamples?.[0] ||
  resp.generatedSamples?.[0] ||
  resp.predictions?.[0];
const uri = sample?.video?.uri || sample?.video?.url || sample?.uri;
const inline = sample?.video?.bytesBase64Encoded || sample?.bytesBase64Encoded;

if (inline) {
  fs.writeFileSync(outMp4, Buffer.from(inline, "base64"));
  console.log("saved (inline)", outMp4, fs.statSync(outMp4).size);
} else if (uri) {
  const dl = await fetch(uri.includes("key=") ? uri : `${uri}&key=${key}`);
  const buf = Buffer.from(await dl.arrayBuffer());
  fs.writeFileSync(outMp4, buf);
  console.log("saved (uri)", outMp4, buf.length);
} else {
  console.error("no video in response:", JSON.stringify(done).slice(0, 1000));
  process.exit(5);
}
