import sharp from "sharp";
import { readdirSync, statSync } from "node:fs";
const dir = process.env.UPLOADS_DIR || "public/uploads/projects";
const files = readdirSync(dir).map((f) => ({ f, t: statSync(`${dir}/${f}`).mtimeMs })).sort((a, b) => b.t - a.t).slice(0, 3);
for (const { f } of files) {
  const m = await sharp(`${dir}/${f}`).metadata();
  console.log(f, m.width + "x" + m.height, (m.width! / m.height!).toFixed(3));
}
