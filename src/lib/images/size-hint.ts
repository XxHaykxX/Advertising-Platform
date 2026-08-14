// The ratio optimize.ts crops every non-avatar/cast upload to (`fit: "cover"`).
// Shared so a MediaCropDialog frame always matches what the server does with
// the result — a crop step off by even a little means `cover` bites again.
export const WIDE_ASPECT = 16 / 9;

// Client-safe (NOT server-only) mirror of kindForDir's classification, used to
// show the recommended upload size next to each image field so the uploader
// knows what it will be resized to. Keep in sync with src/lib/images/optimize.ts.
export function imageSizeHint(dir: string): string {
  const d = (dir || "").toLowerCase();
  if (d.includes("avatar") || d.includes("logo") || d.includes("partner")) return "512×512 (1:1)";
  if (d.includes("cast") || d.includes("crew") || d.includes("actor")) return "800×800 (1:1)";
  return "16:9 · ≤1600×900";
}
