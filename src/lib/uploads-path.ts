/* Where a stored file path is allowed to point.

   Every "/uploads/…" value in the database arrives as a plain form field: the
   browser uploads a file, the endpoint answers with a path, and the form posts
   that path back on save. The endpoint decides where a file may be WRITTEN
   (src/lib/uploads-store.ts — safeSegment + assertInside + the member
   namespace); this decides what a save is allowed to CLAIM was written, which
   is a separate question and the one nothing was asking before 2026-08-05.

   It matters because these values are rendered as `src`/`href` on public
   pages. An off-site URL smuggled into a poster or a presentation link turns a
   real listing into a pointer at someone else's server, and a "../" walks out
   of the uploads tree on a host where that tree sits next to other files.

   A floor, not a fence: it does not check that the file exists, nor that the
   member who saved it owns it. Where per-member ownership matters — a member's
   own avatar — the caller adds the stricter
   `/uploads/members/<id>/` check on top (see updateBrandProfile).

   Audited against prod before it was switched on: no stored value anywhere in
   the database pointed outside /uploads/, so nothing existing is rewritten by
   the first save that goes through here. */

/** "" (the value that means "no file") passes through unchanged; anything that
   is not a path inside the uploads tree collapses to "" rather than being
   stored. Collapsing rather than throwing is deliberate: a save must not fail
   on a field the editor never touched. */
export function safeUploadPath(value: string | null | undefined): string {
  const v = String(value ?? "").trim();
  if (!v) return "";
  if (!v.startsWith("/uploads/")) return "";
  // Backslashes as well as "..": path.resolve treats "\" as a separator on
  // Windows, and dev runs on Windows even though prod does not.
  if (v.includes("..") || v.includes("\\")) return "";
  return v;
}
