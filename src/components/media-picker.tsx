"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Download, Loader2, X } from "lucide-react";
import { listUploads, uploadImage, type MediaFile } from "@/lib/actions/uploads";
import { listMemberUploads, uploadMemberImage } from "@/lib/actions/member-uploads";
import { useUI, type Locale } from "@/lib/i18n-client";
import { captureVideoPoster, isPosterPath, posterPathFor } from "@/lib/video-poster";
import { cropAspectForDir } from "@/lib/images/size-hint";
import { Dropzone, DropzoneEmptyState } from "@/components/ui/dropzone";

// react-easy-crop is ~37 KB and most opens of this dialog only pick an existing
// file, so it loads on demand — same treatment as in media-field.tsx.
const MediaCropDialog = dynamic(
  () => import("@/components/media-crop-dialog").then((m) => m.MediaCropDialog),
  { ssr: false },
);

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
  locale = "en",
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
   *  whose whole cabinet is in Armenian or Russian. Member-side callers pass
   *  the visitor's locale; admin callers omit it and get "en".
   *
   *  The default used to be DEFAULT_LOCALE, which is "hy" — so every admin
   *  screen that opened this dialog (partners, portfolio, cast) showed it in
   *  Armenian inside an otherwise English panel. */
  locale?: Locale;
}) {
  const t = useUI(locale);
  const [items, setItems] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Set alongside a successful upload (#16, 2026-07-31) — e.g. an mp4 the host
  // couldn't compress server-side. The file IS stored; kept separate from
  // `error` so it doesn't read as a rejection.
  const [warning, setWarning] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("__all__");
  const [pending, startTransition] = useTransition();

  const list = scope === "member" ? listMemberUploads : listUploads;
  const upload = scope === "member" ? uploadMemberImage : uploadImage;

  // Stays an effect: opening the picker fires a request, and the loading flag
  // belongs to that request's lifecycle.
  useEffect(() => {
    if (!open) return;
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  // Same shape as MediaField's acceptMap — filters both the OS picker's file
  // dialog and which dragged files react-dropzone hands to handleFiles.
  const acceptMap: Record<string, string[]> =
    accept === "video"
      ? { "video/mp4": [".mp4"], "video/webm": [".webm"] }
      : accept === "any"
        ? { "image/*": [], "video/mp4": [".mp4"], "video/webm": [".webm"] }
        : { "image/*": [] };

  // Click-to-browse and drag-and-drop both land here — the dropzone below is
  // the dialog's only upload affordance now (audit: "uploading is a button
  // only, there is no drop zone at all").
  /** Files waiting for their turn in the crop dialog, and the ones already
   *  framed. A ref rather than state for the results: the queue advances from
   *  inside the dialog's callbacks and the finished batch is read once, when
   *  the last file is done — re-rendering on every append would buy nothing. */
  const [cropQueue, setCropQueue] = useState<File[]>([]);
  const croppedRef = useRef<File[]>([]);
  const cropAspect = cropAspectForDir(uploadDir);

  /** Hand the next file to the dialog, or start uploading once none are left.
   *  Cancelling one file skips that file only — the rest of a dropped batch
   *  still goes through, which is what "cancel" means when five were dropped
   *  and one was wrong. */
  function advanceCrop(rest: File[]) {
    if (rest.length > 0) {
      setCropQueue(rest);
      return;
    }
    setCropQueue([]);
    const batch = croppedRef.current;
    croppedRef.current = [];
    if (batch.length) uploadFiles(batch);
  }

  function handleFiles(picked: File[]) {
    if (!picked.length) return;
    setError(null);
    setWarning(null);
    // Nothing to frame: no crop rule for this folder (the server pads instead
    // of cutting), or these are videos.
    const needsCrop =
      cropAspect !== null && accept !== "video" && picked.some((f) => f.type.startsWith("image/"));
    if (!needsCrop) {
      uploadFiles(picked);
      return;
    }
    croppedRef.current = picked.filter((f) => !f.type.startsWith("image/"));
    setCropQueue(picked.filter((f) => f.type.startsWith("image/")));
  }

  function uploadFiles(picked: File[]) {
    startTransition(async () => {
      const added: MediaFile[] = [];
      for (const file of picked) {
        const kind = accept === "any" ? (file.type.startsWith("video/") ? "video" : "image") : accept;
        // Size-check before the round trip: past the framework body limit the
        // request is cut off mid-flight and the server-side "too large" message
        // never gets a chance to run, so the user would only see a generic
        // failure. Mirrors MAX_BYTES / MAX_BYTES_VIDEO in lib/uploads-store.ts —
        // null there and here means clips have no cap (2026-08-19).
        const maxMb = kind === "video" ? null : 8;
        if (maxMb !== null && file.size > maxMb * 1024 * 1024) {
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
        let res: { path?: string; error?: string; warning?: string };
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
        if (res.warning) setWarning(res.warning);
        if (res.path) added.push({ path: res.path, size: file.size, mtime: Date.now() });
      }
      if (added.length) setItems((prev) => [...added, ...prev]);
    });
  }

  if (!open) return null;

  return (
    <>
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
            {pending ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
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

        {/* Same shared zone every other upload surface uses — this dialog used
            to only offer a header button (audit 2026-07-28: "there is no drop
            zone at all"). Pinned above the scrollable grid so it stays put. */}
        <div className="border-b border-border px-5 py-4">
          <Dropzone
            accept={acceptMap}
            multiple
            maxFiles={0}
            disabled={pending}
            onDrop={handleFiles}
            onError={(e) => setError(e.message)}
            labels={{ title: t("media.dropTitleMany"), hint: t("media.dropHere") }}
          >
            <DropzoneEmptyState />
          </Dropzone>
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
          {warning && <p className="mb-3 text-xs text-muted-foreground">{warning}</p>}
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

    {/* Outside the backdrop above on purpose: rendered inside it, a click on
        the crop frame would bubble to that div's onClick and close the picker
        underneath. */}
    {cropQueue.length > 0 && cropAspect !== null ? (
      <MediaCropDialog
        file={cropQueue[0]}
        aspect={cropAspect}
        locale={locale}
        labels={{
          title: t("projectForm.offer.crop.title"),
          zoom: t("projectForm.offer.crop.zoom"),
          cancel: t("projectForm.offer.crop.cancel"),
          apply: t("projectForm.offer.crop.apply"),
        }}
        onCancel={() => advanceCrop(cropQueue.slice(1))}
        onDone={(file) => {
          croppedRef.current.push(file);
          advanceCrop(cropQueue.slice(1));
        }}
      />
    ) : null}
    </>
  );
}
