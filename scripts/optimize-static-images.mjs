// Recompresses the static decorative JPEGs in public/kino and public/hero.
// Filenames and extensions are never changed (they're referenced by hardcoded paths).
//
// Usage:
//   node scripts/optimize-static-images.mjs         (writes the optimized files)
//   node scripts/optimize-static-images.mjs --dry    (report only, no writes)

import { readdir, stat, readFile, writeFile, rename, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const DRY_RUN = process.argv.includes("--dry");
const MAX_WIDTH = 900;
const JPEG_OPTIONS = {
  quality: 72,
  progressive: true,
  chromaSubsampling: "4:2:0",
  mozjpeg: true,
};

const TARGET_DIRS = ["public/kino", "public/hero"];

async function listJpegs(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && /\.jpe?g$/i.test(e.name))
    .map((e) => path.join(dir, e.name));
}

async function optimizeOne(filePath) {
  const before = await stat(filePath);
  const originalBytes = await readFile(filePath);
  const metadata = await sharp(originalBytes).metadata();

  let pipeline = sharp(originalBytes).rotate(); // auto-orient before strip
  if (metadata.width && metadata.width > MAX_WIDTH) {
    pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
  }
  // sharp strips EXIF/ICC metadata by default; withMetadata() would do the
  // opposite (re-attach it), so it must not be called here.
  const optimizedBytes = await pipeline.jpeg(JPEG_OPTIONS).toBuffer();

  const afterBytes = optimizedBytes.length;
  const beforeBytes = before.size;
  const savingPct = beforeBytes > 0 ? ((beforeBytes - afterBytes) / beforeBytes) * 100 : 0;
  const isSmaller = afterBytes < beforeBytes; // idempotency guard: never write a larger file

  if (isSmaller && !DRY_RUN) {
    const tmpPath = `${filePath}.tmp`;
    await writeFile(tmpPath, optimizedBytes);
    await unlink(filePath);
    await rename(tmpPath, filePath);
  }

  return {
    file: filePath,
    beforeBytes,
    afterBytes,
    savingPct,
    isSmaller,
    written: isSmaller && !DRY_RUN,
  };
}

function kb(bytes) {
  return (bytes / 1024).toFixed(1);
}

async function main() {
  const files = (await Promise.all(TARGET_DIRS.map(listJpegs))).flat().sort();

  const results = [];
  for (const file of files) {
    try {
      results.push(await optimizeOne(file));
    } catch (err) {
      console.error(`FAILED: ${file}: ${err.message}`);
    }
  }

  console.log(
    `\n${"file".padEnd(34)} ${"before KB".padStart(10)} ${"after KB".padStart(10)} ${"saving %".padStart(9)}  status`,
  );
  console.log("-".repeat(80));

  let totalBefore = 0;
  let totalAfter = 0;

  for (const r of results) {
    totalBefore += r.beforeBytes;
    // On disk, a file only shrinks if we actually wrote it (or would, in --dry).
    totalAfter += r.isSmaller ? r.afterBytes : r.beforeBytes;

    const status = DRY_RUN
      ? r.isSmaller
        ? "would write"
        : "would skip (not smaller)"
      : r.written
        ? "written"
        : "skipped (not smaller)";

    console.log(
      `${path.relative(process.cwd(), r.file).padEnd(34)} ${kb(r.beforeBytes).padStart(10)} ${kb(r.afterBytes).padStart(10)} ${r.savingPct.toFixed(1).padStart(8)}%  ${status}`,
    );
  }

  console.log("-".repeat(80));
  const totalSavingPct = totalBefore > 0 ? ((totalBefore - totalAfter) / totalBefore) * 100 : 0;
  console.log(
    `TOTAL: ${(totalBefore / 1024 / 1024).toFixed(2)} MB -> ${(totalAfter / 1024 / 1024).toFixed(2)} MB (${totalSavingPct.toFixed(1)}% saved)${DRY_RUN ? "  [dry run, nothing written]" : ""}`,
  );
}

main();
