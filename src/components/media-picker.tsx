"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Download, Loader2, Upload, X } from "lucide-react";
import { listUploads, uploadImage, type MediaFile } from "@/lib/actions/uploads";
import { listMemberUploads, uploadMemberImage } from "@/lib/actions/member-uploads";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";
import { captureVideoPoster, isPosterPath, posterPathFor } from "@/lib/video-poster";

// Reusable image picker modal. Opens a library of existing uploads and lets you
// either pick one or upload a new file from the computer — the chosen /uploads/…
// path is handed back via onSelect. Two scopes:
//  - "staff": the whole media library (listUploads / uploadImage), folder chips.
//  - "member": only the current member's own uploads (listMemberUploads /
//    uploadMemberImage) — a creator never sees anyone else's files.
export type MediaPickerScope = "staff" | "member";

/** What kind of file this picker instance deals with (#10 video upload).
 *  "image" (default) keeps every existing image-only caller unchanged. */
export type MediaPickerAccept = "image" | "video" | "any";

function folderOf(path: string): string {
  const parts = path.split("/").filter(Boolean); // ["uploads","<folder>",...]
  return parts.length >= 3 ? parts[1] : "misc";
}

export function isVideoPath(path: string): boolean {
  return /\.(mp4|webm)$/i.test(path);
}

export function MediaPicker({
  open,
  onClose,
  onSelect,
  scope = "staff",
  uploadDir,
  accept = "image",
  locale = DEFAULT_LOCALE,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (path: string) => void;
  scope?: MediaPickerScope;
  /** Subfolder new uploads go into (staff: /uploads/<dir>/…, member: inside
   *  their own namespace). */
  uploadDir: string;
  /** File kind this instance picks — restricts the file-input accept, the
   *  upload kind sent to the server, and which library items are shown. */
  accept?: MediaPickerAccept;
  /** Audit 4.5: this dialog was English-only for everyone, including members
   *  whose whole cabinet is in Armenian or Russian. Admin callers can leave it
   *  at the default (admin UI is pinned to "en"); member-side callers pass the
   *  visitor's locale. */
  locale?: Locale;
}) {
  const t = makeUI(locale);
  const [items, setItems] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("__all__");
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const list = scope === "member" ? listMemberUploads : listUploads;
  const upload = scope === "member" ? uploadMemberImage : uploadImage;

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    setError(null);
    list()
      .then((files) => {
        if (alive) setItems(files);
      })
      .catch(() => {
        if (alive) setError(t("media.loadError"));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, scope]);

  // Only show items matching this picker's kind (an "any" picker shows both).
  // Poster frames live next to their video as "<video>.jpg" — they're part of
  // the tile, not files in their own right.
  const posters = useMemo(() => new Set(items.filter((f) => isPosterPath(f.path)).map((f) => f.path)), [items]);
  const typed = useMemo(() => {
    const real = items.filter((f) => !isPosterPath(f.path));
    if (accept === "any") return real;
    return real.filter((f) => isVideoPath(f.path) === (accept === "video"));
  }, [items, accept]);

  // Folder chips (staff only — a member's flat namespace needs no filter).
  const folders = useMemo(() => {
    if (scope !== "staff") return [];
    return [...new Set(typed.map((f) => folderOf(f.path)))].sort();
  }, [typed, scope]);

  const visible = useMemo(() => {
    if (scope !== "staff" || filter === "__all__") return typed;
    return typed.filter((f) => folderOf(f.path) === filter);
  }, [typed, filter, scope]);

  const inputAccept =
    accept === "video" ? "video/mp4,video/webm" : accept === "any" ? "image/*,video/mp4,video/webm" : "image/*";

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files || []);
    e.target.value = "";
    if (!picked.length) return;
    setError(null);
    startTransition(async () => {
      const added: MediaFile[] = [];
      for (const file of picked) {
        const kind = accept === "any" ? (file.type.startsWith("video/") ? "video" : "image") : accept;
        // Size-check before the round trip: past the framework body limit the
        // request is cut off mid-flight and the server-side "max 50 MB" message
        // never gets a chance to run, so the user would only see a generic
        // failure. Mirrors MAX_BYTES / MAX_BYTES_VIDEO in lib/actions/uploads.ts.
        const maxMb = kind === "video" ? 50 : 8;
        if (file.size > maxMb * 1024 * 1024) {
          const mb = Math.round((file.size / (1024 * 1024)) * 10) / 10;
          setError(t("media.errTooLarge", { name: file.name, size: String(mb), limit: String(maxMb) }));
          continue;
        }
        const fd = new FormData();
        fd.append("file", file);
        fd.append("dir", uploadDir);
        fd.append("kind", kind);
        if (kind === "video") {
          // Grab a frame here, while the file is already in memory — see
          // lib/video-poster.ts for why the server can't do it.
          const poster = await captureVideoPoster(file);
          if (poster) fd.append("poster", poster);
        }
        // A rejected action (framework 413 when the body exceeds
        // serverActions.bodySizeLimit, a proxy cutting the request, a network
        // drop) used to reject this promise inside startTransition: no message,
        // no thrown error the user could see — the dialog just sat there and
        // "MP4 upload doesn't work". Surface it instead.
        let res: { path?: string; error?: string };
        try {
          res = await upload(fd);
        } catch {
          const mb = Math.round((file.size / (1024 * 1024)) * 10) / 10;
          setError(t("media.errUploadFailed", { name: file.name, size: String(mb) }));
          continue;
        }
        if (res.error) {
          setError(res.error);
          continue;
        }
        if (res.path) added.push({ path: res.path, size: file.size, mtime: Date.now() });
      }
      if (added.length) setItems((prev) => [...added, ...prev]);
    });
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold text-foreground">
            {accept === "video"
              ? t("media.chooseVideo")
              : accept === "any"
                ? t("media.chooseFile")
                : t("media.chooseImage")}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {t("media.upload")}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={inputAccept}
              multiple
              onChange={onPickFiles}
              className="hidden"
            />
            <button
              type="button"
              onClick={onClose}
              aria-label={t("media.close")}
              className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {folders.length > 1 && (
          <div className="flex flex-wrap gap-2 border-b border-border px-5 py-2">
            {["__all__", ...folders].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  filter === f
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {f === "__all__" ? t("media.all") : f}
              </button>
            ))}
          </div>
        )}

        {/* data-lenis-prevent: MediaPicker is also mounted from member forms
            under /account… and from public-side flows, where Lenis eats the
            wheel unless a scroller opts out. */}
        <div data-lenis-prevent className="min-h-[200px] flex-1 overflow-y-auto p-5">
          {error && <p className="mb-3 text-xs text-primary">{error}</p>}
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : visible.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              {accept === "video" ? t("media.emptyVideos") : t("media.emptyImages")}
            </p>
          ) : (
            /* 16:9 tiles, one column fewer than before — every image in the app
               is 16:9, so square tiles cropped the preview AND made it small
               (user request 2026-07-26: "a bit bigger, 16:9"). */
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {visible.map((f) => (
                <div
                  key={f.path}
                  className="group relative aspect-video overflow-hidden rounded-lg border border-border bg-muted transition-colors hover:border-primary"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(f.path);
                      onClose();
                    }}
                    className="absolute inset-0"
                    title={f.path}
                  >
                    {isVideoPath(f.path) ? (
                      // Show the video's own first frame rather than a generic
                      // icon — a wall of identical icons told you nothing about
                      // which clip is which (user report 2026-07-26). "#t=0.1"
                      // seeks a hair in so the frame isn't the opening black.
                      posters.has(posterPathFor(f.path)) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={posterPathFor(f.path)} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <video
                        src={`${f.path}#t=0.1`}
                        className="h-full w-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                        onLoadedMetadata={(e) => {
                          // The media fragment alone leaves the element blank
                          // in some browsers; seeking forces a real decode.
                          const v = e.currentTarget;
                          if (v.currentTime === 0) {
                            try {
                              v.currentTime = Math.min(0.1, (v.duration || 1) / 2);
                            } catch {
                              /* seeking unsupported — blank poster, not fatal */
                            }
                          }
                        }}
                      />
                      )
                    ) : (
                      <Image src={f.path} alt="" fill className="object-cover" sizes="200px" unoptimized />
                    )}
                  </button>
                  <a
                    href={f.path}
                    download
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`${t("media.download")} ${f.path.split("/").pop()}`}
                    title={t("media.download")}
                    className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-md bg-background/80 text-muted-foreground opacity-0 transition-opacity hover:text-primary focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
