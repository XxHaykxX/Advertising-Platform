import "server-only";
import sharp from "sharp";

/** Post-upload image optimization (#images, 2026-07-20). Every uploaded or
 *  AI-generated image is resized + recompressed to one of three targets so the
 *  site stays consistent and light. This is the single place that decides the
 *  STORED file — its weight on disk, its crop, its aspect ratio — regardless
 *  of what Next does with it afterwards.
 *
 *  Next's own image optimizer was switched on in next.config.ts on 2026-07-31
 *  (it used to run with `unoptimized: true`); that's a *separate*, runtime
 *  pass — it re-encodes per `sizes`/breakpoint for network transfer on the way
 *  out, it does not touch the file on disk, and it never crops or normalizes
 *  aspect ratio the way this module does. The two are complementary, not
 *  redundant: skipping this pass would mean storing (and re-optimizing on
 *  every cache miss) whatever multi-megabyte, arbitrary-aspect original a
 *  phone or screenshot tool produced.
 *
 *   - avatar / logo → 512×512 (1:1), fit "contain" on a transparent canvas so a
 *     logo is never clipped.
 *   - cast / crew    → 800×800 (1:1), center-cropped.
 *   - everything else → 16:9, capped at 1600×900 (never upscaled past the
 *     source width — smaller is fine), center-cropped.
 *
 *  Output is always WebP: visually ~equal to high-quality JPEG/PNG but much
 *  lighter, and it keeps alpha (so a transparent logo stays transparent). */

export type ImageKind = "avatar" | "cast" | "wide";

/** Classify an upload dir into a sizing target. Substring match so any
 *  poster/gallery/frame/portfolio/catalog dir falls through to "wide". */
export function kindForDir(dir: string): ImageKind {
  const d = dir.toLowerCase();
  if (d.includes("avatar") || d.includes("logo") || d.includes("partner")) return "avatar";
  if (d.includes("cast") || d.includes("crew") || d.includes("actor")) return "cast";
  return "wide";
}

export type OptimizedImage = { buffer: Buffer; ext: "webp" };

const WIDE_MAX_W = 1600;
// q80 WebP is visually ~indistinguishable from the source at these sizes while
// cutting weight sharply vs JPEG q85 / PNG. effort 5 = better ratio, still fast.
const WEBP = { quality: 80, effort: 5 } as const;

export async function optimizeImage(input: Buffer, kind: ImageKind): Promise<OptimizedImage> {
  // .rotate() bakes in EXIF orientation so phone photos aren't sideways.
  const base = () => sharp(input, { failOn: "none" }).rotate();

  if (kind === "avatar") {
    const buffer = await base()
      .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ ...WEBP, quality: 85, alphaQuality: 100 })
      .toBuffer();
    return { buffer, ext: "webp" };
  }

  if (kind === "cast") {
    const buffer = await base()
      .resize(800, 800, { fit: "cover", position: "centre" })
      .webp(WEBP)
      .toBuffer();
    return { buffer, ext: "webp" };
  }

  // wide: 16:9, width ≤ 1600 but never larger than the source (smaller OK).
  const meta = await sharp(input).metadata();
  const w = Math.min(meta.width ?? WIDE_MAX_W, WIDE_MAX_W);
  const h = Math.round((w * 9) / 16);
  const buffer = await base()
    .resize(w, h, { fit: "cover", position: "centre" })
    .webp(WEBP)
    .toBuffer();
  return { buffer, ext: "webp" };
}
