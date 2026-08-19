/* Keys, paths and the guards between them.
 *
 * Every uploaded file is addressed three ways, and this module is the only
 * place that converts between them:
 *
 *   public path   /uploads/videos/1723-ab.mp4    what the database stores and
 *                                                what a browser asks for
 *   key           videos/1723-ab.mp4             what a storage driver takes
 *   location      <UPLOADS_DIR>/videos/1723-ab.mp4   (fs driver)
 *                 s3://<bucket>/uploads/videos/1723-ab.mp4   (s3 driver)
 *
 * The public path shape is deliberately unchanged by the S3 migration. It is
 * written into a dozen VARCHAR columns and into every saved history version, so
 * changing it would mean rewriting the database; keeping it means the move is a
 * file copy and a CloudFront behaviour, nothing more.
 *
 * The guards here are the security-critical part. They replace per-call-site
 * `path.resolve` + "is it still inside the root" checks, which only work when
 * the destination IS a filesystem — S3 has no such thing as a resolved path, so
 * a key containing ".." would simply create an object literally called "..".
 */

/** Characters allowed in a single folder segment supplied by a caller.
 *
 *  The dot is deliberately allowed — folder names like "v1.2" are legitimate —
 *  and that used to be the hole: ".." survived the filter untouched and
 *  path.join() normalised it, climbing one level out of the uploads root. A
 *  segment made only of dots is never a real folder name, so it collapses to
 *  the fallback.
 *
 *  This is the single copy. There were two before: the strict one in
 *  uploads-store.ts and a weaker twin in uploads-fs.ts that was missing the
 *  dots-only check entirely (it predates the 2026-07-30 fix and was never
 *  updated). Both of uploads-fs's callers pass the literal "projects", so
 *  nothing was reachable through it — but a second copy of a security rule is
 *  exactly how the next caller ends up on the wrong side of it. */
export function safeSegment(input: string): string {
  const cleaned = input.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 64);
  if (/^\.+$/.test(cleaned)) return "misc";
  return cleaned || "misc";
}

/** True when `key` is a plain relative key with no way out of the root.
 *
 *  Rejects: absolute keys, "." and ".." segments, empty segments (which would
 *  produce "a//b" — a different object in S3 and the same file on disk),
 *  backslashes (a separator on Windows, an ordinary character in S3) and NULs. */
export function isSafeKey(key: string): boolean {
  if (!key || key.length > 1024) return false;
  if (key.startsWith("/") || key.includes("\\") || key.includes("\0")) return false;
  return key.split("/").every((seg) => seg !== "" && seg !== "." && seg !== "..");
}

/** "/uploads/videos/x.mp4" → "videos/x.mp4". Null for anything that is not a
 *  safe path inside the uploads tree — an off-site URL, a traversal attempt, or
 *  the bare "/uploads/" prefix with nothing after it. */
export function publicPathToKey(publicPath: string): string | null {
  if (!publicPath.startsWith("/uploads/")) return null;
  const key = publicPath.slice("/uploads/".length);
  return isSafeKey(key) ? key : null;
}

/** "videos/x.mp4" → "/uploads/videos/x.mp4". */
export function keyToPublicPath(key: string): string {
  return `/uploads/${key}`;
}

/** Joins key parts, dropping empty ones. The empty part is the normal case, not
 *  an edge one: staff uploads have no prefix at all (they own the whole tree),
 *  a member's have "members/<id>" — and "" + "videos" must give "videos", never
 *  "/videos", which isSafeKey() would then reject. */
export function joinKey(...parts: string[]): string {
  return parts.filter(Boolean).join("/");
}

/** Content type by extension.
 *
 *  On disk this only decorated the response; in S3 it is stored ON the object
 *  and is what a browser is told when CloudFront serves it directly, with no
 *  code of ours in the path. An object saved without it comes back as
 *  application/octet-stream, which means a poster downloads instead of
 *  rendering and a clip refuses to play. */
const CONTENT_TYPE: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  svg: "image/svg+xml",
  mp4: "video/mp4",
  webm: "video/webm",
  pdf: "application/pdf",
};

export function contentTypeForKey(key: string): string {
  const ext = key.slice(key.lastIndexOf(".") + 1).toLowerCase();
  return CONTENT_TYPE[ext] || "application/octet-stream";
}

/** A PDF is the one thing here a browser will happily open INSIDE the serving
 *  origin, where its embedded scripting runs as that origin. It is also the one
 *  thing nobody wants rendered in place — the only link to it says "Download
 *  presentation". Forcing the attachment disposition settles both (IA-44).
 *
 *  Under S3 this has to be stored as object metadata rather than added to a
 *  response, because CloudFront serves these bytes without asking us. */
export function contentDispositionForKey(key: string): string | undefined {
  return contentTypeForKey(key) === "application/pdf" ? "attachment" : undefined;
}
