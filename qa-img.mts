import sharp from "sharp";
const dir = "C:/Users/Admin/AppData/Local/Temp/claude/C--Users-Admin-Desktop-iGovazd/173a955f-643b-4049-8f7b-673cbad6b02a/scratchpad";
for (const [name, w, h, color] of [["portrait", 600, 1000, "#c0392b"], ["portrait2", 500, 900, "#27ae60"], ["portrait3", 400, 800, "#2980b9"]] as const) {
  await sharp({ create: { width: w, height: h, channels: 3, background: color } }).png().toFile(`${dir}/${name}.png`);
}
console.log("ok");
