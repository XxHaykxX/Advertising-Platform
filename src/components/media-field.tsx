"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { FileVideo, ImageIcon, Loader2 } from "lucide-react";
import { MediaPicker, isVideoPath, type MediaPickerAccept, type MediaPickerScope } from "@/components/media-picker";
import { uploadImage } from "@/lib/actions/uploads";
import { uploadMemberImage } from "@/lib/actions/member-uploads";
import { captureVideoPoster } from "@/lib/video-poster";
import { Dropzone, DropzoneEmptyState, DropzonePreview } from "@/components/ui/dropzone";
import type { Locale } from "@/lib/i18n";
import { imageSizeHint } from "@/lib/images/size-hint";

/** Mirror of MAX_BYTES / MAX_BYTES_VIDEO in lib/actions/uploads.ts. Checked
 *  before the round trip: past the framework body limit the request is cut off
 *  mid-flight and the server's own "too large" message never runs. */
const MAX_MB = { image: 8, video: 50 };

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
  replaceLabel = "Replace",
  removeLabel = "Remove",
  dropReplaceLabel = "Drop to replace",
  previewShape = "video",
  compact = false,
  onChange,
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
  /** Overlay actions on the filled preview, localized by the caller. */
  replaceLabel?: string;
  removeLabel?: string;
  /** Shown while a file hovers over an already filled field. */
  dropReplaceLabel?: string;
  /** Frame of the filled preview. "square" suits a portrait (an avatar), the
   *  16:9 default suits stills, logos and video. */
  previewShape?: "video" | "square";
  /** Row-in-a-table mode: smaller preview, one-line empty zone, no size hint.
   *  A full-width field's three lines of copy get clipped mid-word in a 150px
   *  column, and its size hint repeats on every row. */
  compact?: boolean;
  /** Fires on every value change (upload, picker select, remove) — the row-list
   *  callers that have no hidden-input `name` need this to mirror the path into
   *  their own controlled state. */
  onChange?: (value: string) => void;
}) {
  const [value, setValue] = useState(initial);
  const [open, setOpen] = useState(false);
  // Same reasoning as ImageUploader's drop zone: the picker dialog could always
  // upload, but the form itself had no target to drag a file onto — most of all
  // on the video field, where the file is the whole point.
  const [dropError, setDropError] = useState<string | null>(null);
  const [uploading, startUpload] = useTransition();

  function update(v: string) {
    setValue(v);
    onChange?.(v);
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

    setDropError(null);
    const max = MAX_MB[kind];
    if (file.size > max * 1024 * 1024) {
      const mb = Math.round((file.size / (1024 * 1024)) * 10) / 10;
      setDropError(`${errTooLargeLabel}: ${file.name} (${mb} MB > ${max} MB)`);
      return;
    }

    const fd = new FormData();
    fd.append("file", file);
    fd.append("dir", uploadDir);
    fd.append("kind", kind);
    if (kind === "video") {
      // Grab the still here, while the file is in memory — see lib/video-poster.
      const poster = await captureVideoPoster(file);
      if (poster) fd.append("poster", poster);
    }

    const upload = scope === "member" ? uploadMemberImage : uploadImage;
    startUpload(async () => {
      try {
        const res = await upload(fd);
        if (res.error) setDropError(res.error);
        else if (res.path) update(res.path);
      } catch {
        setDropError(`${errTooLargeLabel}: ${file.name}`);
      }
    });
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
  const frame = compact
    ? "aspect-video w-full"
    : previewShape === "square"
      ? "aspect-square w-40"
      : "aspect-video w-72";
  const preview = value ? (
    <DropzonePreview replaceLabel={replaceLabel} removeLabel={removeLabel} onRemove={() => update("")}>
      <div className={`relative ${frame} max-w-full overflow-hidden bg-muted`}>
        {isVideoPath(value) ? (
          <span className="grid h-full w-full place-items-center gap-1 text-muted-foreground">
            <FileVideo className="h-6 w-6" />
            <span className="max-w-full truncate px-2 text-xs">{value.split("/").pop()}</span>
          </span>
        ) : (
          <Image
            src={value}
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

  return (
    <div className={compact ? "space-y-1.5" : "space-y-3"}>
      {name ? <input type="hidden" name={name} value={value} /> : null}

      {/* Empty: click opens the OS picker, dragging a file onto it uploads. The
          media LIBRARY button lives outside: the empty zone is a <button>, so
          nothing focusable may be nested inside it. */}
      <Dropzone
        accept={acceptMap}
        maxFiles={1}
        maxSize={(accept === "video" ? MAX_MB.video : MAX_MB.image) * 1024 * 1024}
        disabled={uploading}
        onDrop={(files) => handleDrop(files[0])}
        onError={(e) => setDropError(e.message)}
        labels={{ title: dropTitle, hint: dropLabel, replaceHint: dropReplaceLabel }}
        preview={preview}
        // Filled: the zone wraps the picture, and its default w-fit would
        // collapse a w-full preview to nothing. Empty: tighter padding than the
        // full-width field, which is sized for three lines of copy.
        className={compact ? (value ? "w-full" : "w-full p-3") : undefined}
      >
        {/* In a table cell the standard three lines don't fit — they were being
            clipped mid-word. Icon plus one word says the same thing. */}
        {compact ? (
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

      <div className="flex flex-wrap items-center gap-3">
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
        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" /> : null}
      </div>
      {dropError ? <p className="text-xs text-danger">{dropError}</p> : null}

      {/* Video fields state the format + the 50 MB per-file cap enforced by
          uploadImage (MAX_BYTES_VIDEO) — the old silent limit was half the
          "MP4 upload doesn't work" confusion. Repeated once per row it is just
          noise, so a compact field leaves it to the section. */}
      {compact ? null : (
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
    </div>
  );
}
