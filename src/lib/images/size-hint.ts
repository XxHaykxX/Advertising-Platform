// The ratio optimize.ts crops every non-avatar/cast upload to (`fit: "cover"`).
// Shared so a MediaCropDialog frame always matches what the server does with
// the result — a crop step off by even a little means `cover` bites again.
export const WIDE_ASPECT = 16 / 9;

/** Square: what optimize.ts resizes an avatar, a logo or a cast photo to. */
export const SQUARE_ASPECT = 1;

// Client-safe (NOT server-only) mirror of kindForDir's classification, used to
// show the recommended upload size next to each image field so the uploader
// knows what it will be resized to. Keep in sync with src/lib/images/optimize.ts.
export type UploadShape = "avatar" | "cast" | "wide";

export function shapeForDir(dir: string): UploadShape {
  const d = (dir || "").toLowerCase();
  if (d.includes("avatar") || d.includes("logo") || d.includes("partner")) return "avatar";
  if (d.includes("cast") || d.includes("crew") || d.includes("actor")) return "cast";
  return "wide";
}

/** What optimize.ts would produce from a large enough source, per shape — and
 *  therefore the smallest source worth accepting (IA-62, 2026-08-17). The
 *  server never upscales: a 640×360 drop is stored as 640×360 and shows up
 *  blurry on the catalog card, with nothing in the form saying so. A source
 *  BIGGER than this is fine — the crop dialog frames it and the server scales
 *  it down to exactly these numbers. */
export const REQUIRED_SIZE: Record<UploadShape, { w: number; h: number }> = {
  avatar: { w: 512, h: 512 },
  cast: { w: 800, h: 800 },
  wide: { w: 1600, h: 900 },
};

export function requiredSizeForDir(dir: string): { w: number; h: number } {
  return REQUIRED_SIZE[shapeForDir(dir)];
}

/** "1600×900" — the size named in the warning Мариам asked for (IA-62). */
export function formatRequiredSize(dir: string): string {
  const { w, h } = requiredSizeForDir(dir);
  return `${w}×${h}`;
}

/** True when a picked file is too small for its destination folder. Either
 *  side short of the target counts: cropping to 16:9 takes pixels away, it
 *  never adds them. */
export function imageBelowRequired(size: { w: number; h: number }, dir: string): boolean {
  const req = requiredSizeForDir(dir);
  return size.w < req.w || size.h < req.h;
}

export function imageSizeHint(dir: string): string {
  switch (shapeForDir(dir)) {
    case "avatar":
      return "512×512 (1:1)";
    case "cast":
      return "800×800 (1:1)";
    default:
      return "16:9 · ≤1600×900";
  }
}

/**
 * The crop frame to offer for an upload going into `dir`, or null when there is
 * nothing to decide.
 *
 * The frame is derived from the destination rather than typed at each call site
 * on purpose: the server crops by directory name (optimize.ts kindForDir), so a
 * hand-written aspect is one rename away from framing a shot the server then
 * re-crops anyway. One rule, both sides.
 *
 * `avatar` returns null deliberately. That branch resizes with `fit: "contain"`
 * — a wide logo is padded, never cut — so forcing a square frame there would
 * *introduce* the very damage this dialog exists to prevent. Fields that crop
 * an avatar to a square do so because a face wants framing, and they say so by
 * passing an explicit aspect of their own.
 */
export function cropAspectForDir(dir: string): number | null {
  switch (shapeForDir(dir)) {
    case "cast":
      return SQUARE_ASPECT;
    case "wide":
      return WIDE_ASPECT;
    default:
      return null;
  }
}
