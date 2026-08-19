"use client";

import { useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { FileVideo, ImageIcon, UserRound } from "lucide-react";
import { MediaPicker, isVideoPath, type MediaPickerAccept, type MediaPickerScope } from "@/components/media-picker";
import { UploadProgress } from "@/components/ui/upload-progress";
import { holdProgress, uploadViaXhr } from "@/lib/upload-xhr";
import { uploadVideoDirect } from "@/lib/upload-video";
import { captureVideoPoster, posterPathFor } from "@/lib/video-poster";
import { mediaUrl } from "@/lib/media-url";
import { Dropzone, DropzoneEmptyState, DropzonePreview } from "@/components/ui/dropzone";
import type { Locale } from "@/lib/i18n-client";
import {
  cropAspectForDir,
  formatRequiredSize,
  imageBelowRequired,
  imageSizeHint,
} from "@/lib/images/size-hint";
import { readImageSize } from "@/lib/images/read-size";

/** react-easy-crop (~37 KB) is only needed by fields with `cropAspect`, and
 *  only once a file actually needs cropping — loaded on demand instead of
 *  shipping in every page that renders a MediaField (bundle audit
 *  2026-07-31). ssr:false since Cropper reads canvas/Image at mount. */
const MediaCropDialog = dynamic(
  () => import("@/components/media-crop-dialog").then((m) => m.MediaCropDialog),
  { ssr: false },
);

/** Mirror of MAX_BYTES / MAX_BYTES_VIDEO in lib/uploads-store.ts. Checked before
 *  the round trip: past the framework body limit the request is cut off
 *  mid-flight and the server's own "too large" message never runs.
 *  `null` = no cap, which is where video landed on 2026-08-19. */
const MAX_MB: Record<"image" | "video", number | null> = { image: 8, video: null };

/** The file currently going out, with its byte counters. */
type UploadJob = { file: File; loaded: number; total: number };

// Drop-in replacement for the old "<input> a URL" image fields (partner logo,
// portfolio image, …). Mirrors the chosen /uploads/… path into a hidden input
// so the existing form plumbing (a plain string field) keeps working unchanged.
// Clicking Browse opens the shared MediaPicker (pick existing or upload new).
// `accept` defaults to "image" so every existing caller is unaffected; pass
// "video" for an MP4/WebM field (#10 project trailer upload).
export function MediaField({
  name,
  initial = "",
  label = "Browse",
  uploadDir,
  scope = "staff",
  accept = "image",
  fit = "cover",
  locale,
  dropTitle = "Upload a file",
  dropLabel = "Drag and drop or click to upload",
  errTooLargeLabel = "File is too large",
  errTooSmallLabel = "The picture is smaller than the required {size}",
  errUploadFailedLabel = "Upload failed",
  cancelLabel = "Cancel upload",
  replaceLabel = "Replace",
  removeLabel = "Remove",
  dropReplaceLabel = "Drop to replace",
  previewShape = "video",
  compact = false,
  onChange,
  cropAspect: cropAspectProp,
  cropLabels,
}: {
  /** Omit to skip the hidden input — used inside a repeatable row list (e.g.
   *  placements-editor.tsx), where the picked path is read back via `onChange`
   *  into the parent's own row state/hidden JSON mirror instead. */
  name?: string;
  initial?: string;
  label?: string;
  uploadDir: string;
  scope?: MediaPickerScope;
  accept?: MediaPickerAccept;
  /** How the preview fills its 64px box. "cover" (default) suits photos and
   *  posters; "contain" is for logos, where cropping the edges off a wide
   *  wordmark makes it unrecognizable. */
  fit?: "cover" | "contain";
  /** Passed through to the picker so a member sees it in their own language
   *  (audit 4.5). Admin callers omit it — the admin UI is pinned to English. */
  locale?: Locale;
  /** Caption inside the drop zone and the too-large message, localized by the
   *  caller. Admin callers can leave the English defaults. */
  dropTitle?: string;
  dropLabel?: string;
  errTooLargeLabel?: string;
  /** Shown when a dropped picture is smaller than `uploadDir` requires
   *  (IA-62). `{size}` in it is replaced with that folder's target. */
  errTooSmallLabel?: string;
  /** Shown when the upload never came back with an answer (offline, the host
   *  cutting the request, a 502) — localized by the caller. */
  errUploadFailedLabel?: string;
  /** aria-label of the cancel control on the progress block. */
  cancelLabel?: string;
  /** Overlay actions on the filled preview, localized by the caller. */
  replaceLabel?: string;
  removeLabel?: string;
  /** Shown while a file hovers over an already filled field. */
  dropReplaceLabel?: string;
  /** Frame of the filled preview. "square" suits a portrait, the 16:9 default
   *  suits stills and video.
   *
   *  "avatar" / "logo" are the compact profile variants (2026-08-07): a 96px
   *  thumbnail — round for a face, square for a wordmark — with the empty zone
   *  shrunk to the same 96px and the browse button beside it rather than under
   *  it. The full-width field it replaces was ~300px tall for one small
   *  picture. */
  previewShape?: "video" | "square" | "avatar" | "logo";
  /** Row-in-a-table mode: smaller preview, one-line empty zone, no size hint.
   *  A full-width field's three lines of copy get clipped mid-word in a 150px
   *  column, and its size hint repeats on every row. */
  compact?: boolean;
  /** Fires on every value change (upload, picker select, remove) — the row-list
   *  callers that have no hidden-input `name` need this to mirror the path into
   *  their own controlled state. */
  onChange?: (value: string) => void;
  /** Overrides the crop ratio for this field: a freshly dropped image is
   *  cropped to this w/h ratio before it's uploaded. Omit it and the ratio
   *  comes from `uploadDir` (cropAspectForDir) — the same rule the server
   *  crops by, so a plain drop is framed exactly like a pick through the
   *  picker. Pass one only where the field wants a shape the folder does not
   *  imply (an avatar squared on purpose). Video is never cropped, and a file
   *  already in the media library isn't re-cropped either. */
  cropAspect?: number;
  /** Crop dialog copy, localized by the caller. Omit to keep MediaCropDialog's
   *  own English defaults. */
  cropLabels?: { title: string; zoom: string; cancel: string; apply: string; hint?: string };
}) {
  // The folder decides the frame unless the caller says otherwise — see
  // cropAspectForDir. Avatar-shaped folders return null (the server pads there
  // instead of cutting), which reads as "no dialog".
  const cropAspect = cropAspectProp ?? cropAspectForDir(uploadDir) ?? undefined;
  const [value, setValue] = useState(initial);
  const [open, setOpen] = useState(false);
  // A file that's mid-crop — set by handleDrop instead of uploading straight
  // away, cleared once MediaCropDialog cancels or hands back the result.
  const [cropFile, setCropFile] = useState<File | null>(null);
  // Same reasoning as ImageUploader's drop zone: the picker dialog could always
  // upload, but the form itself had no target to drag a file onto — most of all
  // on the video field, where the file is the whole point.
  const [dropError, setDropError] = useState<string | null>(null);
  // Set alongside a successful upload (#16, 2026-07-31) — e.g. an mp4 the host
  // couldn't compress server-side. The file IS stored; this is informational,
  // hence its own state and styling rather than reusing dropError.
  const [dropWarning, setDropWarning] = useState<string | null>(null);
  const [job, setJob] = useState<UploadJob | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const uploading = job !== null;

  function update(v: string) {
    setValue(v);
    onChange?.(v);
  }

  // The actual round trip — shared by a plain drop and by MediaCropDialog's
  // onDone, which hands back a cropped File to go through the same checks.
  //
  // Posted to /api/uploads over XHR rather than through the upload server
  // action: the far end runs the same validation and the same write either way,
  // but only a plain request tells the browser how many bytes have actually
  // gone out. On the trailer field that is the whole difference — a 50 MB mp4
  // on a home connection used to be a spinner and nothing else.
  async function uploadFile(file: File, kind: "image" | "video") {
    setDropError(null);
    setDropWarning(null);
    const max = MAX_MB[kind];
    if (max !== null && file.size > max * 1024 * 1024) {
      const mb = Math.round((file.size / (1024 * 1024)) * 10) / 10;
      setDropError(`${errTooLargeLabel}: ${file.name} (${mb} MB > ${max} MB)`);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    // Shown before the first byte leaves: grabbing the poster frame below
    // decodes the file first, which on a big clip is a visible pause of its own.
    setJob({ file, loaded: 0, total: file.size });

    const fd = new FormData();
    fd.append("file", file);
    fd.append("dir", uploadDir);
    fd.append("kind", kind);
    // Grab the still here, while the file is in memory — see lib/video-poster.
    const poster = kind === "video" ? await captureVideoPoster(file) : null;
    if (poster) fd.append("poster", poster);
    if (controller.signal.aborted) {
      abortRef.current = null;
      setJob(null);
      return;
    }

    const startedAt = Date.now();
    const onProgress = ({ loaded, total }: { loaded: number; total: number }) =>
      setJob((current) => (current?.file === file ? { ...current, loaded, total } : current));

    // A clip goes straight to the bucket when storage can sign for it — the
    // app never sees the bytes, because a single large upload buffered here
    // costs several times its own size in memory and is enough on its own to
    // take the one task down. `null` back means storage said "direct" (local
    // disk: dev and Hostinger), and this falls through to the path it has
    // always taken.
    const direct =
      kind === "video"
        ? await uploadVideoDirect(file, {
            scope,
            dir: uploadDir,
            poster,
            signal: controller.signal,
            errorLabel: errUploadFailedLabel,
            onProgress,
          })
        : null;

    const res =
      direct ??
      (await uploadViaXhr(fd, {
        scope,
        signal: controller.signal,
        errorLabel: errUploadFailedLabel,
        onProgress,
      }));

    abortRef.current = null;
    if (res.canceled) {
      setJob(null);
      return; // the user asked for this — not an error
    }
    if (res.error) {
      setJob(null);
      setDropError(res.error);
      return;
    }
    if (res.path) {
      // Finish the bar, then let it stand for its minimum before the poster
      // replaces it — see holdProgress. Without this the block exists but is
      // never actually seen on a fast upload.
      setJob((current) => (current ? { ...current, loaded: current.total } : current));
      await holdProgress(startedAt);
      setJob(null);
      if (res.warning) setDropWarning(res.warning);
      update(res.path);
      return;
    }
    setJob(null);
  }

  async function handleDrop(file: File | undefined) {
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    const kind: "image" | "video" =
      accept === "video" ? "video" : accept === "any" ? (isVideo ? "video" : "image") : "image";
    // Refuse a mismatch outright rather than uploading a picture into the
    // trailer slot: the field decides what it accepts, not the file.
    if (accept === "video" && !isVideo) return;
    if (accept === "image" && isVideo) return;

    // IA-62: a picture smaller than what this folder is resized to never gets
    // sharper on the way in (optimize.ts never upscales), so it is refused
    // before the crop dialog rather than stored blurry.
    if (!isVideo) {
      const size = await readImageSize(file);
      if (size && imageBelowRequired(size, uploadDir)) {
        setDropError(
          `${errTooSmallLabel.replace("{size}", formatRequiredSize(uploadDir))} (${size.w}×${size.h})`,
        );
        return;
      }
      setDropError(null);
    }

    // A fresh upload on a cropAspect field goes through the crop dialog first
    // — uploadFile only runs once MediaCropDialog hands back the result.
    // A file picked from the library (already on the server) skips this: it
    // never reaches handleDrop, only MediaPicker's own onSelect does.
    if (cropAspect && accept === "image") {
      setCropFile(file);
      return;
    }

    await uploadFile(file, kind);
  }

  const acceptMap: Record<string, string[]> =
    accept === "video"
      ? { "video/mp4": [".mp4"], "video/webm": [".webm"] }
      : accept === "any"
        ? { "image/*": [], "video/mp4": [".mp4"], "video/webm": [".webm"] }
        : { "image/*": [] };

  // Filled → the file itself is the zone (replace by dropping on it or via the
  // overlay); empty → the drop zone. The old layout showed both at once plus a
  // 64px thumbnail underneath, which read as two separate targets.
  // The two profile variants share every measurement and differ only in the
  // corner radius, so they're one branch everywhere below.
  const isProfile = previewShape === "avatar" || previewShape === "logo";
  const round = previewShape === "avatar";
  const frame = compact
    ? "aspect-video w-full"
    : isProfile
      ? `size-24 ${round ? "rounded-full" : "rounded-xl"}`
      : previewShape === "square"
        ? "aspect-square w-40"
        : "aspect-video w-72";
  const filled = value ? (
    <DropzonePreview
      replaceLabel={replaceLabel}
      removeLabel={removeLabel}
      onRemove={() => update("")}
      iconOnly={isProfile}
      round={round}
    >
      <div className={`relative ${frame} max-w-full overflow-hidden bg-muted`}>
        {isVideoPath(value) ? (
          <VideoThumbnail key={value} path={value} />
        ) : (
          <Image
            src={mediaUrl(value)}
            alt=""
            fill
            className={fit === "contain" ? "object-contain p-2" : "object-cover"}
            sizes="288px"
            unoptimized
          />
        )}
      </div>
    </DropzonePreview>
  ) : undefined;

  // While a file is going out the block stands in the slot the result will
  // occupy, at the same size, so the field doesn't jump when it lands. The
  // zone draws its own ring around a preview, hence border-0 here.
  const preview = job ? (
    <UploadProgress
      value={job.loaded}
      max={job.total}
      size={(previewShape === "square" || isProfile) && !compact ? "square" : "block"}
      // At 96px the file name is a row of clipped characters — the percentage
      // alone says everything the block has room to say.
      caption={isProfile ? undefined : job.file.name}
      onCancel={() => abortRef.current?.abort()}
      cancelLabel={cancelLabel}
      className={`border-0 ${
        compact ? "w-full" : isProfile ? "w-24" : previewShape === "square" ? "w-40" : "w-72"
      }`}
    />
  ) : (
    filled
  );

  return (
    <div className={isProfile ? "flex flex-wrap items-center gap-4" : compact ? "space-y-1.5" : "space-y-3"}>
      {name ? <input type="hidden" name={name} value={value} /> : null}

      {/* Empty: click opens the OS picker, dragging a file onto it uploads. The
          media LIBRARY button lives outside: the empty zone is a <button>, so
          nothing focusable may be nested inside it. */}
      <Dropzone
        accept={acceptMap}
        maxFiles={1}
        // undefined = the dropzone imposes no size limit of its own; on the
        // video field that is now the case (MAX_MB.video is null).
        maxSize={
          (accept === "video" ? MAX_MB.video : MAX_MB.image) === null
            ? undefined
            : (accept === "video" ? MAX_MB.video! : MAX_MB.image!) * 1024 * 1024
        }
        disabled={uploading}
        onDrop={(files) => handleDrop(files[0])}
        onError={(e) => setDropError(e.message)}
        labels={{ title: dropTitle, hint: dropLabel, replaceHint: dropReplaceLabel }}
        preview={preview}
        // Filled: the zone wraps the picture, and its default w-fit would
        // collapse a w-full preview to nothing. Empty: tighter padding than the
        // full-width field, which is sized for three lines of copy. A profile
        // field keeps the empty zone at exactly the size of the picture that
        // will land in it.
        className={
          isProfile
            ? preview
              ? round
                ? "rounded-full"
                : undefined
              : `size-24 shrink-0 p-0 ${round ? "rounded-full" : ""}`
            : compact
              ? preview
                ? "w-full"
                : "w-full p-3"
              : undefined
        }
      >
        {/* In a table cell the standard three lines don't fit — they were being
            clipped mid-word. Icon plus one word says the same thing. The 96px
            profile circle has room for the icon only; its caption sits beside
            the field, not inside it. */}
        {isProfile ? (
          <DropzoneEmptyState>
            {round ? (
              <UserRound className="h-6 w-6 text-muted-foreground" />
            ) : (
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            )}
          </DropzoneEmptyState>
        ) : compact ? (
          <DropzoneEmptyState>
            <span className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
              <ImageIcon className="h-4 w-4" />
              {dropTitle}
            </span>
          </DropzoneEmptyState>
        ) : (
          <DropzoneEmptyState />
        )}
      </Dropzone>

      <div
        className={
          isProfile ? "flex min-w-0 flex-col items-start gap-1.5" : "flex flex-wrap items-center gap-3"
        }
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={
            compact
              ? "inline-flex items-center gap-1.5 rounded-lg border border-border px-2 py-1 text-xs text-foreground hover:border-primary/40"
              : "inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:border-primary/40"
          }
        >
          <ImageIcon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
          {label}
        </button>
        {/* The zone itself is only an icon here, so the "drag or click" line
            that normally lives inside it moves next to the button. */}
        {isProfile ? <p className="text-xs text-muted-foreground">{dropLabel}</p> : null}
      </div>
      {/* basis-full: in the profile field's single row an error would otherwise
          sit next to the button and squeeze it. */}
      {dropError ? (
        <p className={`text-xs text-danger ${isProfile ? "basis-full" : ""}`}>{dropError}</p>
      ) : null}
      {dropWarning ? (
        <p className={`text-xs text-muted-foreground ${isProfile ? "basis-full" : ""}`}>{dropWarning}</p>
      ) : null}

      {/* Video fields state the format + the 50 MB per-file cap enforced by
          the upload store (MAX_BYTES_VIDEO) — the old silent limit was half the
          "MP4 upload doesn't work" confusion. Repeated once per row it is just
          noise, so a compact field leaves it to the section. A profile field
          drops it too: the caller already says what the picture is for, and
          the crop step makes the exact pixel size moot. */}
      {compact || isProfile ? null : (
        <p className="text-xs text-muted-foreground">
          {accept === "video" ? "MP4 / WebM · ≤50 MB" : imageSizeHint(uploadDir)}
        </p>
      )}

      <MediaPicker
        open={open}
        onClose={() => setOpen(false)}
        onSelect={(path) => update(path)}
        scope={scope}
        uploadDir={uploadDir}
        accept={accept}
        locale={locale}
      />

      {cropAspect && cropFile ? (
        <MediaCropDialog
          file={cropFile}
          aspect={cropAspect}
          locale={locale}
          labels={cropLabels}
          onCancel={() => setCropFile(null)}
          onDone={(cropped) => {
            setCropFile(null);
            void uploadFile(cropped, "image");
          }}
        />
      ) : null}
    </div>
  );
}

/** A stored clip's own frame, instead of the file name on a grey card.
 *
 *  The frame is captured in the browser at upload time and written next to the
 *  video as "<file>.jpg" (lib/video-poster.ts) — the field just has to point at
 *  it. Two cases legitimately have none: clips uploaded before poster capture
 *  existed, and a codec the browser wouldn't decode. Both fall back to the card
 *  rather than to a broken image, so the caller must key this by path — the
 *  fallback is state, and it has to reset when the video does. */
function VideoThumbnail({ path }: { path: string }) {
  const [noPoster, setNoPoster] = useState(false);
  if (noPoster) return <VideoCard path={path} />;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={mediaUrl(posterPathFor(path))}
      alt=""
      className="h-full w-full object-cover"
      onError={() => setNoPoster(true)}
    />
  );
}

function VideoCard({ path }: { path: string }): ReactNode {
  return (
    <span className="grid h-full w-full place-items-center gap-1 text-muted-foreground">
      <FileVideo className="h-6 w-6" />
      <span className="max-w-full truncate px-2 text-xs">{path.split("/").pop()}</span>
    </span>
  );
}
