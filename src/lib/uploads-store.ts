// Server-only. The validation + persistence half of an upload, without an auth
// gate of its own: the caller decides who is allowed in.
//
// It exists because there are now TWO front doors to the same write — the
// "use server" action in src/lib/actions/uploads.ts and the multipart route
// handler in src/app/api/uploads/route.ts (added so the browser can report
// real upload progress, which it never does for a Server Action). Those two
// must accept and reject exactly the same files; a second hand-written copy of
// the rules is how an upload endpoint quietly ends up laxer than the action it
// shadows. A "use server" file can only export async functions, so the shared
// part cannot live there — hence a plain module.
import "server-only";
import { randomUUID } from "node:crypto";
import { optimizeImage, kindForDir } from "@/lib/images/optimize";
import {
  contentDispositionForKey,
  contentTypeForKey,
  joinKey,
  keyToPublicPath,
  safeSegment,
  storage,
} from "@/lib/storage";
import { ffmpegAvailable, transcodeMp4 } from "@/lib/video/optimize";

export const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
// Video branch (project trailer upload, #10). Capped at 50 MB until
// 2026-08-19, when the owner asked for no cap at all: the clips clients
// actually send are phone recordings, and a 4K minute is past 50 MB before
// anyone has done anything wrong.
//
// null = no cap. Two things this does NOT remove, so don't read it as "any
// file will now go through":
//   • the whole body is buffered into this process before the file is written,
//     so a very large upload is that much resident memory on shared hosting —
//     the ceiling is now the host's RAM rather than a number we chose;
//   • Passenger/nginx in front of the app has its own request-body limit that
//     no change here can lift.
// #16 (2026-07-31): mp4 still gets an ffmpeg pass when the host has one — see
// prepareVideo() below.
export const MAX_BYTES_VIDEO: number | null = null;
/** A sales deck (IA-44). Well above a realistic slide deck, well below the
   video cap — a PDF is stored byte-for-byte, so nothing shrinks it afterwards. */
export const MAX_BYTES_DOC = 20 * 1024 * 1024; // 20 MB

// (There used to be a MAX_BODY_BYTES here — a content-length early-out on the
// route, sized as "the video cap plus room for the poster frame". With no video
// cap there is nothing to size it against: the route cannot tell a clip from a
// still before parsing the body, so any ceiling it kept would be a ceiling on
// video uploads under another name.)

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};
const EXT_BY_TYPE_VIDEO: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
};
/** The one non-media upload the site takes: a project's sales deck (IA-44,
 *  2026-08-05). Its own kind rather than a third image type, because it skips
 *  the sharp pass entirely and lives under its own size cap and folder. */
const EXT_BY_TYPE_DOC: Record<string, string> = {
  "application/pdf": "pdf",
};
/** Presentations are the only thing this folder holds, and the only place a
 *  document may land — see the folder/kind rule in storeUpload. */
export const DOC_DIR = "presentations";

// safeSegment() and the "is it still inside the root" check both moved to
// src/lib/storage/keys.ts when storage stopped necessarily being a filesystem.
// The rules did not change — see the comments there, including why the dot is
// in the allowlist and why a dots-only segment collapses.

/** Every rejection the store can produce. Passed in rather than hardcoded: the
 *  admin panel is pinned to English while a member sees their cabinet in their
 *  own language, and both go through this same code. */
export type UploadMessages = {
  noFile: string;
  /** A still aimed at the Videos folder. */
  notAVideo: string;
  /** A clip aimed at a stills folder. */
  notAnImage: string;
  /** Anything but a PDF aimed at the Presentations folder, or a PDF aimed
   *  anywhere else. */
  notADoc: string;
  tooLargeImage: string;
  tooLargeVideo: string;
  tooLargeDoc: string;
  unsupportedImage: string;
  unsupportedVideo: string;
  unsupportedDoc: string;
  processFailed: string;
};

/** Admin-panel wording — English, matching the rest of /admin. */
export const STAFF_UPLOAD_MESSAGES: UploadMessages = {
  noFile: "No file provided.",
  notAVideo: "This folder only takes MP4 / WebM.",
  notAnImage: "Upload videos to the Videos folder.",
  notADoc: "The Presentations folder only takes PDF.",
  tooLargeImage: "File too large (max 8 MB).",
  tooLargeVideo: "File too large (max 50 MB).",
  tooLargeDoc: "File too large (max 20 MB).",
  unsupportedImage: "Unsupported type — use JPG, PNG, WebP, GIF or AVIF.",
  unsupportedVideo: "Unsupported type — use MP4 or WebM.",
  unsupportedDoc: "Unsupported type — use PDF.",
  processFailed: "Could not process image.",
};

/** Member wording — these land in a cabinet rendered in the visitor's own
 *  language (audit 4.5), so they come from the dictionary. */
export function memberUploadMessages(
  t: (key: string, vars?: Record<string, string | number>) => string,
): UploadMessages {
  return {
    noFile: t("media.errNoFile"),
    notAVideo: t("media.errUnsupportedVideo"),
    notAnImage: t("media.errUnsupportedImage"),
    notADoc: t("media.errUnsupportedDoc"),
    tooLargeImage: t("media.errTooLargeServer", { limit: String(MAX_BYTES / (1024 * 1024)) }),
    // Unreachable while MAX_BYTES_VIDEO is null; kept so re-introducing a cap
    // is a one-line change rather than a message hunt.
    tooLargeVideo: t("media.errTooLargeServer", {
      limit: String((MAX_BYTES_VIDEO ?? 0) / (1024 * 1024)),
    }),
    tooLargeDoc: t("media.errTooLargeServer", { limit: String(MAX_BYTES_DOC / (1024 * 1024)) }),
    unsupportedImage: t("media.errUnsupportedImage"),
    unsupportedVideo: t("media.errUnsupportedVideo"),
    unsupportedDoc: t("media.errUnsupportedDoc"),
    processFailed: t("media.loadError"),
  };
}

export type StoreUploadOptions = {
  /** Key prefix everything lands under. Staff: "" — they own the whole tree.
   *  Member: "members/<id>", so `dir` can never reach anyone else's files even
   *  before safeSegment() gets involved.
   *
   *  Was a pair (absolute root + public prefix) until the storage driver
   *  landed. One value now, because the two could disagree: the root decided
   *  where bytes went and the prefix decided what path was handed back, and
   *  nothing checked that they described the same place. */
  keyPrefix: string;
  messages: UploadMessages;
};

/** `warning` is set alongside a successful `path` — never instead of it — for
 *  cases the upload should still succeed but the editor ought to know about
 *  (right now: an mp4 that couldn't be compressed server-side). */
export type StoredUpload = { path?: string; error?: string; warning?: string };

/** The one place a stored name is built, so no branch and no front door can
 *  drift on the naming convention. */
function keyFor(keyPrefix: string, dir: string, ext: string) {
  return joinKey(keyPrefix, dir, `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`);
}

/** The folder/type rule, stated once. "videos" holds clips and nothing else;
 *  everything else holds stills, except "references", which legitimately takes
 *  both — a past project may be shown as a still OR as a clip (2026-07-26).
 *  Documents get the mirror of the same rule: exactly one folder, and that
 *  folder takes nothing else, or a PDF could land among the posters where
 *  every reader expects an image. */
const MIXED_DIRS = new Set(["references"]);
function folderKindError(dir: string, kind: string, messages: UploadMessages): string | null {
  if (dir === "videos" && kind !== "video") return messages.notAVideo;
  if (dir !== "videos" && kind === "video" && !MIXED_DIRS.has(dir)) return messages.notAnImage;
  if ((dir === DOC_DIR) !== (kind === "doc")) return messages.notADoc;
  return null;
}

/** Trust the declared type first; some browsers and phones send a blank or
 *  non-standard MIME for .mp4 (often "application/octet-stream"), so fall back
 *  to the filename extension — whitelisted to the same two — before rejecting. */
function videoExt(contentType: string, filename: string): string | undefined {
  return EXT_BY_TYPE_VIDEO[contentType] || filename.toLowerCase().match(/\.(mp4|webm)$/)?.[1];
}

export type VideoUploadPlan = { key: string; ext: string } | { error: string };

/** Decide where a clip is allowed to land, without seeing a single byte of it.
 *
 *  Split out of storeUpload so that a presigned upload — where the bytes go
 *  straight to the bucket and the app never sees them — is gated by the SAME
 *  code rather than by a second hand-written copy of the rules. That is the
 *  failure this module's header warns about, and it gets sharper here: with
 *  presigning, whatever this function decides is signed into a URL and cannot
 *  be re-checked afterwards, because there is no afterwards.
 *
 *  `keyPrefix` comes from the caller's session, never from the request — that
 *  is the whole of the member namespace guarantee. A client may propose `dir`
 *  and its own file's type; it can propose nothing else, and `dir` is passed
 *  through safeSegment() exactly as it is on the multipart path. */
export function planVideoUpload(
  input: { dir: string; contentType: string; filename: string },
  opts: StoreUploadOptions,
): VideoUploadPlan {
  const dir = safeSegment(input.dir || "misc");
  const folderError = folderKindError(dir, "video", opts.messages);
  if (folderError) return { error: folderError };

  const ext = videoExt(input.contentType, input.filename);
  if (!ext) return { error: opts.messages.unsupportedVideo };

  return { key: keyFor(opts.keyPrefix, dir, ext), ext };
}

/** Validate a multipart upload and write it. Identical rules whichever front
 *  door called: the folder/type rule, the per-kind size cap, the MIME/extension
 *  allowlist, the sharp pass for stills and the poster frame for clips. */
export async function storeUpload(fd: FormData, opts: StoreUploadOptions): Promise<StoredUpload> {
  const { keyPrefix, messages } = opts;
  const store = storage();

  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: messages.noFile };

  const dir = safeSegment(String(fd.get("dir") || "misc"));
  const kind = String(fd.get("kind") || "image");
  // Pulled out up front so `fd` is unreachable from here down. writePosterFrame
  // only ever wanted this one entry, and taking the whole FormData to get it
  // kept every other entry — including the video's own multi-hundred-MB Blob —
  // reachable to the end of the function.
  //
  // Measured 2026-08-19, and it did NOT move peak RSS: 200 MB improved ~11%,
  // 500 MB got ~11% worse, which is noise. A request finishes in under two
  // seconds, and dropping a reachability edge only pays off if a GC pass
  // happens to run inside that window. The real 4-5x cost of an upload lives
  // inside Next/undici's own body and multipart handling, not here — so this
  // is a narrower contract, not a memory fix, and nothing should be built on
  // it as though it were one.
  const poster = fd.get("poster");

  // The client already filters, but a direct call must not be able to drop a
  // JPEG into /uploads/videos or a clip among the posters. Shared with the
  // presign path so the two cannot diverge.
  const folderError = folderKindError(dir, kind, messages);
  if (folderError) return { error: folderError };

  if (kind === "doc") {
    if (file.size > MAX_BYTES_DOC) return { error: messages.tooLargeDoc };
    const ext = EXT_BY_TYPE_DOC[file.type];
    if (!ext) return { error: messages.unsupportedDoc };

    const rawBuffer = Buffer.from(await file.arrayBuffer());
    // A PDF is stored byte-for-byte — nothing re-encodes it the way sharp
    // re-encodes a still, so the declared MIME is the ONLY thing vouching for
    // the contents. Check the magic number too: this file ends up served from
    // our own origin, and a renamed .html would otherwise ride in on a
    // hand-built request and run as same-origin script in a brand's browser.
    if (rawBuffer.subarray(0, 5).toString("latin1") !== "%PDF-") {
      return { error: messages.unsupportedDoc };
    }

    const key = keyFor(keyPrefix, dir, ext);
    await store.put(key, rawBuffer, {
      contentType: contentTypeForKey(key),
      // Forced attachment, the reason the magic-number check above exists.
      // Under S3 this rides on the object, because CloudFront serves the bytes
      // with none of our code in the path to add a response header.
      contentDisposition: contentDispositionForKey(key),
    });

    return { path: keyToPublicPath(key) };
  }

  if (kind === "video") {
    if (MAX_BYTES_VIDEO !== null && file.size > MAX_BYTES_VIDEO) {
      return { error: messages.tooLargeVideo };
    }
    const ext = videoExt(file.type, file.name);
    if (!ext) return { error: messages.unsupportedVideo };

    const rawBuffer = Buffer.from(await file.arrayBuffer());
    const key = keyFor(keyPrefix, dir, ext);

    const { buffer: outBuffer, warning } = await prepareVideo(rawBuffer, ext, file.size);
    await store.put(key, outBuffer, { contentType: contentTypeForKey(key) });
    await writePosterFrame(poster, key);

    return { path: keyToPublicPath(key), warning };
  }

  if (file.size > MAX_BYTES) return { error: messages.tooLargeImage };
  const ext = EXT_BY_TYPE[file.type];
  if (!ext) return { error: messages.unsupportedImage };

  const rawBuffer = Buffer.from(await file.arrayBuffer());

  // Animated GIFs lose their animation if pushed through the webp branch
  // below: sharp only preserves frames when it is explicitly told to read
  // them (`{ animated: true }`), and optimizeImage() doesn't — it always emits
  // one static frame, which for an animated source is a silent regression, not
  // a compression win. Static GIFs would compress fine as webp, but there's no
  // cheap way here to tell "animated" from "static" apart from decoding twice,
  // so every GIF is stored as-is (still under the same MAX_BYTES cap above).
  let outBuffer: Buffer;
  let outExt: string = ext;
  if (ext === "gif") {
    outBuffer = rawBuffer;
  } else {
    // Optimize (resize + recompress) to the target for this dir before saving.
    try {
      const optimized = await optimizeImage(rawBuffer, kindForDir(dir));
      outBuffer = optimized.buffer;
      outExt = optimized.ext;
    } catch {
      return { error: messages.processFailed };
    }
  }

  const key = keyFor(keyPrefix, dir, outExt);
  await store.put(key, outBuffer, { contentType: contentTypeForKey(key) });

  return { path: keyToPublicPath(key) };
}

/** #16 (2026-07-31): re-encode mp4 uploads when the host has ffmpeg on PATH;
 *  Hostinger shared hosting is the one most likely not to (hence the whole
 *  fallback), so this never blocks an upload on it being there. WebM is left
 *  untouched either way — re-encoding it to H.264/AAC would also mean
 *  changing its container to .mp4, which is a bigger change than this pass
 *  makes, and the Videos folder mostly sees phone/export MP4s in practice. */
async function prepareVideo(
  raw: Buffer,
  ext: string,
  originalBytes: number,
): Promise<{ buffer: Buffer; warning?: string }> {
  if (ext !== "mp4") return { buffer: raw };

  const mb = () => (originalBytes / (1024 * 1024)).toFixed(1);

  if (!(await ffmpegAvailable())) {
    return {
      buffer: raw,
      warning: `Stored without server-side compression — ffmpeg isn't available on this host (${mb()} MB as uploaded).`,
    };
  }

  const transcoded = await transcodeMp4(raw);
  if (!transcoded) {
    return { buffer: raw, warning: `Server-side compression failed — stored as uploaded (${mb()} MB).` };
  }
  return { buffer: transcoded };
}

/** Store the poster frame the browser grabbed for an uploaded video, as
 *  "<video-file>.jpg" next to it.
 *
 *  Why the client sends it: a <video> tile can only paint a frame after the
 *  browser has the file's metadata, and for a 40 MB mp4 with its moov atom at
 *  the end that means downloading the whole thing — so the Videos folder sat
 *  mostly blank (user report 2026-07-26). Generating the frame server-side
 *  would need ffmpeg, which shared hosting doesn't have; the browser already
 *  decoded the file to show a preview, so it hands over a small JPEG instead.
 *  Best-effort: a missing or broken poster just means the tile falls back to
 *  the <video> element. */
async function writePosterFrame(poster: FormDataEntryValue | null, videoKey: string) {
  if (!(poster instanceof File) || poster.size === 0) return;
  if (poster.size > 2 * 1024 * 1024) return; // a frame is tens of KB; ignore junk
  try {
    // "<video-key>.jpg" — the sidecar convention the video tiles look for. It
    // survives the move to S3 unchanged: it was never a filesystem feature,
    // just a name derived from another name.
    await storage().put(`${videoKey}.jpg`, Buffer.from(await poster.arrayBuffer()), {
      contentType: "image/jpeg",
    });
  } catch {
    /* poster is a nicety, never fail the upload over it */
  }
}
