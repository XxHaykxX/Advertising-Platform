/** Byte-range parsing for the /uploads file route.
 *
 *  Lives in its own module (not inside app/uploads/[...path]/route.ts) because a
 *  route file may only export the HTTP verbs + route config — exporting a helper
 *  from there for tests is not allowed. */

/** "bytes=0-" / "bytes=1000-2000" / "bytes=-500" -> [start, end] clamped to the
 *  file size, or null when the header is absent, malformed, unsatisfiable, or a
 *  multi-range request (the caller then answers with a plain 200 and the browser
 *  copes). `end` is inclusive, matching the HTTP semantics. */
export function parseRange(header: string | null, size: number): [number, number] | null {
  if (!header || size <= 0) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m) return null;
  const [, rawStart, rawEnd] = m;
  if (!rawStart && !rawEnd) return null;
  let start: number;
  let end: number;
  if (!rawStart) {
    // Suffix range: "bytes=-500" = the last 500 bytes.
    const len = Number(rawEnd);
    if (!Number.isFinite(len) || len <= 0) return null;
    start = Math.max(0, size - len);
    end = size - 1;
  } else {
    start = Number(rawStart);
    end = rawEnd ? Number(rawEnd) : size - 1;
  }
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  end = Math.min(end, size - 1);
  if (start > end || start >= size) return null;
  return [start, end];
}
