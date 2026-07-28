"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Folder,
  Images,
  Loader2,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { deleteUpload, saveVideoPoster, uploadImage, type MediaFile } from "@/lib/actions/uploads";
import { captureVideoPoster, isPosterPath, posterPathFor } from "@/lib/video-poster";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Dropzone, DropzoneEmptyState } from "@/components/ui/dropzone";

/** Mirrors MAX_BYTES / MAX_BYTES_VIDEO in lib/actions/uploads.ts. Checked
 *  before the round trip: past the framework body limit the request is cut
 *  off mid-flight and the server's own "too large" message never runs — the
 *  same pre-check the picker and the form fields already do. */
const MAX_MB = { image: 8, video: 50 };

// Folders that always appear (even when empty) so you can open one and upload
// into it. `slug` is the on-disk subfolder under /uploads/ (uploadImage `dir`).
// The folders the app actually uploads into — every `dir` / `uploadDir` passed
// to a picker or uploader, and nothing else. They're listed even when empty so
// you can open one and upload into it.
//
// "cast-crew" and "catalog" used to sit here as well, which was the source of
// the duplicate/ghost folders in the library: nothing ever wrote to them, while
// the real files landed in "actors" and "projects" (user report 2026-07-26).
const CANONICAL = [
  { slug: "projects", label: "Projects — posters & stills" },
  { slug: "actors", label: "Cast & Crew" },
  { slug: "videos", label: "Videos" },
  { slug: "references", label: "Reference projects" },
  { slug: "portfolio", label: "Portfolio" },
  { slug: "partners", label: "Partners" },
  { slug: "avatars", label: "Avatars" },
] as const;

const FOLDER_LABEL: Record<string, string> = {
  projects: "Projects — posters & stills",
  actors: "Cast & Crew",
  videos: "Videos",
  references: "Reference projects",
  portfolio: "Portfolio",
  partners: "Partners",
  avatars: "Avatars",
  members: "Member uploads",
  misc: "Misc",
};

/** The Videos folder holds clips; every other folder holds stills. Uploads are
 *  restricted accordingly — a still in /uploads/videos/ (or a clip among the
 *  posters) is always a mistake, and the mismatch used to be accepted silently
 *  (user request 2026-07-26). */
const VIDEO_FOLDER = "videos";
function folderTakesVideo(slug: string | null): boolean {
  return slug === VIDEO_FOLDER;
}

/** Uploaded videos (mp4/webm) need a <video> element, not next/image — an
 *  <Image> pointed at an .mp4 renders a broken tile, which is why the Videos
 *  folder showed no frames at all. `#t=0.1` makes the browser seek a hair into
 *  the file so the poster frame is an actual frame, not black. */
function isVideoFile(path: string): boolean {
  return /\.(mp4|webm)$/i.test(path);
}

/** One tile's visual: a still, or a video's first frame.
 *
 *  The `#t=0.1` media fragment alone is unreliable — some browsers paint a
 *  frame, others leave the element blank until playback starts, which is why
 *  most of the Videos folder came out empty. Nudging currentTime once metadata
 *  is in forces an actual decode, so every tile ends up with a real frame. */
function Thumb({ path, poster, sizes = "200px" }: { path: string; poster?: string; sizes?: string }) {
  if (isVideoFile(path)) {
    // A poster captured at upload time is instant and always right; the
    // <video> fallback below only matters for clips uploaded before that
    // existed.
    if (poster) {
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={poster} alt="" className="h-full w-full object-cover" />;
    }
    return (
      <video
        src={`${path}#t=0.1`}
        className="h-full w-full object-cover"
        muted
        playsInline
        preload="metadata"
        onLoadedMetadata={(e) => {
          const v = e.currentTarget;
          if (v.currentTime === 0) {
            // Not 0: a seek to exactly 0 is a no-op in some engines, and the
            // very first frame of an encode is often black anyway.
            try {
              v.currentTime = Math.min(0.1, (v.duration || 1) / 2);
            } catch {
              /* seeking unsupported — the poster stays blank, not worth failing */
            }
          }
        }}
      />
    );
  }
  return <Image src={path} alt="" fill className="object-cover" sizes={sizes} unoptimized />;
}

const ALL = "__all__";

type UploadQueueItem = { name: string; status: "pending" | "done" | "error"; error?: string };

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** First path segment after /uploads/ — the folder a file lives in. */
function folderOf(path: string): string {
  const parts = path.split("/").filter(Boolean); // ["uploads","<folder>","file"]
  return parts.length >= 3 ? parts[1] : "misc";
}

function labelOf(slug: string): string {
  return FOLDER_LABEL[slug] || slug;
}

export function MediaManager({ files }: { files: MediaFile[] }) {
  const [allFiles, setItems] = useState(files);
  // Poster frames ("<video>.jpg") belong to their video's tile, not to the
  // library as separate entries — keep them out of every count and grid, and
  // look them up by convention instead.
  const posters = useMemo(
    () => new Set(allFiles.filter((f) => isPosterPath(f.path)).map((f) => f.path)),
    [allFiles],
  );
  const items = useMemo(() => allFiles.filter((f) => !isPosterPath(f.path)), [allFiles]);
  /** The stored poster for a video, or undefined when it was uploaded before
   *  posters existed. */
  function posterOf(path: string): string | undefined {
    const candidate = posterPathFor(path);
    return posters.has(candidate) ? candidate : undefined;
  }
  // null = root (folder list); ALL = every file; otherwise a folder slug.
  const [open, setOpen] = useState<string | null>(null);

  const [copied, setCopied] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  // Filename search (#media search) — client-side substring filter over the
  // current folder/ALL view. Reset on folder switch so a query doesn't leak
  // between folders.
  const [search, setSearch] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // Drag-drop anywhere on the folder view (#15), on top of the dedicated
  // Dropzone below — highlights the whole view, and a per-file progress list
  // is shown while `uploadFiles` runs.
  const [dropActive, setDropActive] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);

  // Folder list for the root view: canonical folders first (always shown), then
  // any other folder that has files, each with a count + a thumbnail.
  const folders = useMemo(() => {
    const map = new Map<string, MediaFile[]>();
    for (const f of items) {
      const g = folderOf(f.path);
      (map.get(g) || map.set(g, []).get(g)!).push(f);
    }
    const order: string[] = [...CANONICAL.map((c) => c.slug)];
    for (const slug of [...map.keys()].sort()) if (!order.includes(slug)) order.push(slug);
    return order.map((slug) => ({
      slug,
      label: labelOf(slug),
      files: map.get(slug) || [],
    }));
  }, [items]);

  // Files shown in the current view (a folder, or ALL).
  const visible = useMemo(() => {
    if (open === ALL) return items;
    if (open) return items.filter((f) => folderOf(f.path) === open);
    return [];
  }, [items, open]);

  // `visible` further narrowed by the filename search box (case-insensitive
  // substring on the path, which includes the filename). Empty query = all.
  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return visible;
    return visible.filter((f) => f.path.toLowerCase().includes(q));
  }, [visible, search]);

  // New folder or new search query invalidates the lightbox index (it's
  // positional into `shown`) — close it rather than risk showing the wrong file.
  useEffect(() => {
    setLightboxIndex(null);
  }, [open, search]);

  // Shared by the Dropzone below and the page-level drop target — both just
  // gather a File[] and hand it here. Uploads one at a time (uploadImage is
  // still single-file) but tracks each file's own status in `uploadQueue` so
  // the user sees per-file progress rather than one blanket spinner.
  function uploadFiles(picked: File[]) {
    if (!picked.length || !open || open === ALL) return;
    const dir = open;
    setError(null);
    setUploadQueue(picked.map((f) => ({ name: f.name, status: "pending" })));
    startTransition(async () => {
      const added: MediaFile[] = [];
      for (let i = 0; i < picked.length; i++) {
        const file = picked[i];
        const looksVideo = file.type.startsWith("video/") || /\.(mp4|webm)$/i.test(file.name);
        // Wrong folder for this kind of file — say so instead of storing it
        // somewhere it doesn't belong.
        if (looksVideo !== folderTakesVideo(dir)) {
          const message = folderTakesVideo(dir)
            ? `“${file.name}” isn't a video — this folder only takes MP4 / WebM.`
            : `“${file.name}” is a video — upload it to the Videos folder.`;
          setError(message);
          setUploadQueue((q) => q.map((it, idx) => (idx === i ? { ...it, status: "error", error: message } : it)));
          continue;
        }
        // The dedicated Dropzone below already screens this via its own
        // `maxSize`, but a file dropped anywhere else on the page (the
        // page-level target further down) skips that gate — check again here.
        const maxMb = looksVideo ? MAX_MB.video : MAX_MB.image;
        if (file.size > maxMb * 1024 * 1024) {
          const mb = Math.round((file.size / (1024 * 1024)) * 10) / 10;
          const message = `“${file.name}” is ${mb} MB — the limit is ${maxMb} MB.`;
          setError(message);
          setUploadQueue((q) => q.map((it, idx) => (idx === i ? { ...it, status: "error", error: message } : it)));
          continue;
        }
        const fd = new FormData();
        fd.append("file", file);
        fd.append("dir", dir);
        // The library's own uploader takes videos too (the Videos folder), so
        // it captures a poster frame here just like the picker does.
        if (looksVideo) {
          fd.append("kind", "video");
          const poster = await captureVideoPoster(file);
          if (poster) fd.append("poster", poster);
        }
        const res = await uploadImage(fd);
        if (res.error) {
          setError(res.error);
          setUploadQueue((q) => q.map((it, idx) => (idx === i ? { ...it, status: "error", error: res.error } : it)));
          continue;
        }
        setUploadQueue((q) => q.map((it, idx) => (idx === i ? { ...it, status: "done" } : it)));
        if (res.path) added.push({ path: res.path, size: file.size, mtime: Date.now() });
      }
      if (added.length) setItems((prev) => [...added, ...prev]);
    });
  }

  // Videos uploaded before poster capture existed have no thumbnail, and the
  // <video> fallback can't paint one without pulling the whole file. This
  // walks those clips once — fetch, grab a frame in the browser, upload it as
  // the poster — so the folder stops looking empty. One-off by design: new
  // uploads bring their own poster.
  const [backfilling, setBackfilling] = useState<{ done: number; total: number } | null>(null);
  const missingPosters = useMemo(
    () => shown.filter((f) => isVideoFile(f.path) && !posterOf(f.path)),
    // posterOf reads `posters`, which is derived from allFiles
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shown, posters],
  );

  function backfillPosters() {
    if (!missingPosters.length) return;
    const targets = [...missingPosters];
    setBackfilling({ done: 0, total: targets.length });
    startTransition(async () => {
      const added: MediaFile[] = [];
      for (let i = 0; i < targets.length; i++) {
        const target = targets[i];
        try {
          const res = await fetch(target.path);
          const blob = await res.blob();
          const name = target.path.split("/").pop() || "video.mp4";
          const poster = await captureVideoPoster(new File([blob], name, { type: blob.type || "video/mp4" }));
          if (poster) {
            // Only the poster is sent: the video stays exactly where it is,
            // because projects reference that path (Project.videoFile,
            // reference rows) and replacing the file would break them.
            const fd = new FormData();
            fd.append("videoPath", target.path);
            fd.append("poster", poster);
            const saved = await saveVideoPoster(fd);
            if (saved.ok) {
              added.push({ path: posterPathFor(target.path), size: poster.size, mtime: Date.now() });
            }
          }
        } catch {
          /* one clip failing shouldn't stop the rest */
        }
        setBackfilling({ done: i + 1, total: targets.length });
      }
      // The new entries are poster files; the videos themselves are untouched.
      if (added.length) setItems((prev) => [...added, ...prev]);
      setBackfilling(null);
      setNotice("Thumbnails generated.");
    });
  }

  function onDragOver(e: React.DragEvent) {
    if (!open || open === ALL) return;
    e.preventDefault();
    setDropActive(true);
  }
  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDropActive(false);
  }
  function onDrop(e: React.DragEvent) {
    if (!open || open === ALL) return;
    e.preventDefault();
    setDropActive(false);
    // Was hardcoded to "image/*", which silently dropped every video dragged
    // onto the page outside the dedicated zone below — the Videos folder
    // never accepted a page-level drop. Match whatever this folder takes.
    const wantsVideo = folderTakesVideo(open);
    uploadFiles(
      Array.from(e.dataTransfer.files || []).filter((f) => f.type.startsWith(wantsVideo ? "video/" : "image/")),
    );
  }

  // Deleting a file is irreversible and hits the disk — ask first (user
  // request 2026-07-26; it used to delete on the first click).
  const [confirmPath, setConfirmPath] = useState<string | null>(null);

  async function remove(path: string) {
    setNotice(null);
    // Non-optimistic: the server refuses if the file is still referenced by a
    // project / portfolio / cast / avatar (would 404 on the live site).
    const res = await deleteUpload(path);
    if (res.error) {
      setNotice(res.error);
      return;
    }
    setItems((prev) => prev.filter((f) => f.path !== path));
    setLightboxIndex(null);
  }

  function copy(path: string) {
    navigator.clipboard?.writeText(path);
    setCopied(path);
    setTimeout(() => setCopied((c) => (c === path ? null : c)), 1500);
  }

  function showPrev() {
    setLightboxIndex((i) => (i === null ? null : (i - 1 + shown.length) % shown.length));
  }
  function showNext() {
    setLightboxIndex((i) => (i === null ? null : (i + 1) % shown.length));
  }

  useEffect(() => {
    if (lightboxIndex === null) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxIndex, shown.length]);

  const activeFile = lightboxIndex !== null ? shown[lightboxIndex] : null;

  // ---- Root: folder list (file-manager home) ---------------------------------
  if (open === null) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {/* All files */}
          <button
            type="button"
            onClick={() => setOpen(ALL)}
            className="flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40"
          >
            <Images className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground">All files</p>
              <p className="text-xs text-muted-foreground">{items.length} items</p>
            </div>
          </button>

          {folders.map((f) => {
            const thumb = f.files[0]?.path;
            return (
              <button
                key={f.slug}
                type="button"
                onClick={() => setOpen(f.slug)}
                className="flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40"
              >
                {thumb ? (
                  <span className="relative h-10 w-[71px] overflow-hidden rounded-md bg-muted">
                    <Thumb path={thumb} poster={posterOf(thumb)} sizes="72px" />
                  </span>
                ) : (
                  <Folder className="h-8 w-8 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-semibold text-foreground">{f.label}</p>
                  <p className="text-xs text-muted-foreground">{f.files.length} items</p>
                </div>
              </button>
            );
          })}
        </div>

        {notice && <Toast message={notice} onClose={() => setNotice(null)} />}
      </div>
    );
  }

  // ---- Inside a folder (or ALL) ----------------------------------------------
  const inFolder = open !== ALL;
  return (
    <div
      // The ring is the page-level target's own feedback (a drop landing
      // outside the dedicated zone below still uploads) — distinct from the
      // zone's own highlight so the two affordances don't look identical.
      className={`space-y-4 rounded-2xl transition-shadow ${dropActive ? "ring-2 ring-primary/40" : ""}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setOpen(null);
            setLightboxIndex(null);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-primary/40"
        >
          <ArrowLeft className="h-4 w-4" />
          Folders
        </button>
        <h2 className="text-sm font-semibold text-foreground">
          {open === ALL ? "All files" : labelOf(open)}{" "}
          <span className="text-muted-foreground">
            ({search.trim() ? `${shown.length} of ${visible.length}` : visible.length})
          </span>
        </h2>

        <div className="ml-auto flex items-center gap-2">
          {visible.length > 0 && (
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by filename…"
                className="w-48 rounded-lg border border-border bg-card py-1.5 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none sm:w-64"
              />
            </div>
          )}
          {inFolder && missingPosters.length > 0 && (
            <button
              type="button"
              onClick={backfillPosters}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground transition-colors hover:border-primary/40 disabled:opacity-60"
              title="Generate a thumbnail for videos uploaded before previews existed"
            >
              {backfilling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {backfilling.done}/{backfilling.total}
                </>
              ) : (
                <>
                  <Images className="h-4 w-4" />
                  Generate thumbnails ({missingPosters.length})
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {inFolder && (
        <div className="space-y-2">
          {/* Same shared zone every other upload surface on the site uses —
              this page used to be the odd one out, with a page-wide drop
              target but no visible, clickable zone of its own. */}
          <Dropzone
            accept={folderTakesVideo(open) ? { "video/mp4": [".mp4"], "video/webm": [".webm"] } : { "image/*": [] }}
            multiple
            maxFiles={0}
            maxSize={(folderTakesVideo(open) ? MAX_MB.video : MAX_MB.image) * 1024 * 1024}
            disabled={pending}
            // Otherwise a drop landing on the zone would also bubble to the
            // page-level onDrop above and upload every file twice.
            noDragEventsBubbling
            onDrop={uploadFiles}
            onError={(e) => setError(e.message)}
            labels={{
              title: folderTakesVideo(open) ? "Upload videos" : "Upload images",
              hint: "Drag and drop or click to upload",
            }}
          >
            <DropzoneEmptyState />
          </Dropzone>
          <p className="text-center text-xs text-muted-foreground">
            {folderTakesVideo(open) ? "MP4 / WebM, up to 50 MB each" : "JPG / PNG / WebP, up to 8 MB each"}. Files go to{" "}
            <code>/uploads/{open}/</code>.
          </p>
        </div>
      )}
      {error && <p className="text-xs text-primary">{error}</p>}

      {uploadQueue.length > 0 && (
        <ul className="space-y-1 rounded-xl border border-border bg-card p-3">
          {uploadQueue.map((item, i) => (
            <li key={`${item.name}-${i}`} className="flex items-center gap-2 text-xs">
              {item.status === "pending" && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />}
              {item.status === "done" && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />}
              {item.status === "error" && <AlertCircle className="h-3.5 w-3.5 shrink-0 text-primary" />}
              <span className="truncate text-foreground">{item.name}</span>
              {item.status === "error" && item.error && (
                <span className="truncate text-primary">— {item.error}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {visible.length > 0
            ? "No files match your search."
            : inFolder
              ? "Empty folder — upload images with the button above."
              : "No files."}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((f, i) => (
            <div key={f.path} className="overflow-hidden rounded-xl border border-border bg-card">
              <button
                type="button"
                onClick={() => setLightboxIndex(i)}
                aria-label="View image"
                className="relative block aspect-video w-full bg-muted"
              >
                <Thumb path={f.path} poster={posterOf(f.path)} />
              </button>
              <div className="space-y-2 p-3">
                <p className="truncate text-xs text-muted-foreground" title={f.path}>
                  {f.path}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{humanSize(f.size)}</span>
                  <div className="flex items-center gap-1">
                    {/* Download the original file — the library is where both
                        staff and creators come to fetch an asset back out, and
                        the only way to do that used to be copying the path and
                        pasting it into the address bar (user request
                        2026-07-26). `download` keeps the stored filename. */}
                    <a
                      href={f.path}
                      download
                      aria-label="Download"
                      title="Download"
                      className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => copy(f.path)}
                      aria-label="Copy path"
                      className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmPath(f.path)}
                      aria-label="Delete"
                      className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-primary"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {copied === f.path && <p className="text-xs text-success">Copied</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeFile && lightboxIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxIndex(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
        >
          <p className="absolute top-4 left-1/2 -translate-x-1/2 text-sm text-white/80">
            {lightboxIndex + 1} / {shown.length}
          </p>
          <a
            href={activeFile.path}
            download
            onClick={(e) => e.stopPropagation()}
            aria-label="Download"
            title="Download"
            className="absolute top-4 right-16 grid h-9 w-9 place-items-center rounded-md text-white hover:bg-white/10"
          >
            <Download className="h-5 w-5" />
          </a>
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            aria-label="Close"
            className="absolute top-4 right-4 grid h-9 w-9 place-items-center rounded-md text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
          {shown.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                showPrev();
              }}
              aria-label="Previous"
              className="absolute left-4 grid h-10 w-10 place-items-center rounded-full text-white hover:bg-white/10"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          <div
            className="relative h-[80vh] w-[80vw] max-h-[80vh] max-w-[80vw]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* A video opens as a real player, not a broken <Image>. */}
            {isVideoFile(activeFile.path) ? (
              <video
                src={activeFile.path}
                className="h-full w-full object-contain"
                controls
                autoPlay
                playsInline
              />
            ) : (
              <Image src={activeFile.path} alt="" fill className="object-contain" sizes="80vw" unoptimized />
            )}
          </div>
          {shown.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                showNext();
              }}
              aria-label="Next"
              className="absolute right-4 grid h-10 w-10 place-items-center rounded-full text-white hover:bg-white/10"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmPath !== null}
        title="Delete this file?"
        message={`${confirmPath ?? ""} — the file is removed from disk. This cannot be undone.`}
        confirmLabel="Delete"
        onCancel={() => setConfirmPath(null)}
        onConfirm={() => {
          const target = confirmPath;
          setConfirmPath(null);
          if (target) void remove(target);
        }}
      />

      {notice && <Toast message={notice} onClose={() => setNotice(null)} />}
    </div>
  );
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed inset-x-0 bottom-4 z-50 mx-auto flex max-w-lg items-start gap-3 rounded-xl border border-primary/40 bg-card px-4 py-3 shadow-lg">
      <p className="flex-1 text-xs text-foreground">{message}</p>
      <button type="button" onClick={onClose} aria-label="Dismiss" className="text-muted-foreground hover:text-foreground">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
