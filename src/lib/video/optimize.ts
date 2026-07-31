import "server-only";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** Task #16 (2026-07-31): re-encode an uploaded MP4 to a predictable, light
 *  target instead of storing whatever codec/bitrate the visitor's phone or
 *  editor exported — the same problem the image branch (lib/images/optimize.ts)
 *  already solved for stills. Shared hosting is not guaranteed to have ffmpeg
 *  on PATH, so every call here is best-effort: storeUpload() falls back to the
 *  original file (with a warning) rather than fail the upload. */

let cachedAvailable: Promise<boolean> | null = null;

/** `ffmpeg -version` once per process, then cached — this runs on every video
 *  upload and there is no reason to re-spawn a process just to ask the same
 *  question again. A negative result (missing binary) is exactly as stable as
 *  a positive one: the host either has ffmpeg on PATH or it doesn't, and that
 *  doesn't change while the Node process is alive. */
export function ffmpegAvailable(): Promise<boolean> {
  if (!cachedAvailable) {
    cachedAvailable = execFileAsync("ffmpeg", ["-version"])
      .then(() => true)
      .catch(() => false);
  }
  return cachedAvailable;
}

/** Give the shared box a hard ceiling on how long one upload may occupy the
 *  Node process: veryfast x264 on a 50 MB source should land well inside this,
 *  but a slow neighbour VM is exactly the kind of host this runs on. Missing
 *  the deadline is treated the same as ffmpeg being absent — original file,
 *  no crash. */
const TRANSCODE_TIMEOUT_MS = 120_000;

/** Re-encode an MP4 buffer to 1080p H.264 (CRF 23) + AAC 128k.
 *
 *  - `scale=…force_original_aspect_ratio=decrease` caps the LONGER side at
 *    1080p worth of pixels without ever upscaling a smaller source (`min(...)`
 *    on both dimensions), and `force_divisible_by=2` keeps x264 happy (it
 *    refuses odd dimensions).
 *  - `-movflags +faststart` moves the moov atom to the front so the byte-range
 *    route (app/uploads/[...path]/route.ts) can start playback before the
 *    whole file has downloaded — the same reason that route exists at all.
 *
 *  Returns null (never throws) on anything short of a bug in this function
 *  itself — a bad/corrupt source, ffmpeg crashing, or the timeout above all
 *  come back as "couldn't transcode", and the caller keeps the original. */
export async function transcodeMp4(input: Buffer): Promise<Buffer | null> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "igovazd-upload-"));
  const inPath = path.join(dir, `${randomUUID()}.mp4`);
  const outPath = path.join(dir, `${randomUUID()}.mp4`);
  try {
    await writeFile(inPath, input);
    await execFileAsync(
      "ffmpeg",
      [
        "-y",
        "-i", inPath,
        "-vf", "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2",
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "23",
        "-c:a", "aac",
        "-b:a", "128k",
        "-movflags", "+faststart",
        outPath,
      ],
      { timeout: TRANSCODE_TIMEOUT_MS, killSignal: "SIGKILL" },
    );
    return await readFile(outPath);
  } catch (err) {
    console.error("[uploads] ffmpeg transcode failed", err);
    return null;
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
