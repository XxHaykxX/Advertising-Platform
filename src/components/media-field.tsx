"use client";

import { useState } from "react";
import Image from "next/image";
import { FileVideo, ImageIcon, X } from "lucide-react";
import { MediaPicker, isVideoPath, type MediaPickerAccept, type MediaPickerScope } from "@/components/media-picker";
import type { Locale } from "@/lib/i18n";
import { imageSizeHint } from "@/lib/images/size-hint";

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
  locale,
}: {
  name: string;
  initial?: string;
  label?: string;
  uploadDir: string;
  scope?: MediaPickerScope;
  accept?: MediaPickerAccept;
  /** Passed through to the picker so a member sees it in their own language
   *  (audit 4.5). Admin callers omit it — the admin UI is pinned to English. */
  locale?: Locale;
}) {
  const [value, setValue] = useState(initial);
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={value} />
      <div className="flex items-center gap-3">
        {value ? (
          <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
            {isVideoPath(value) ? (
              <span className="grid h-full w-full place-items-center text-muted-foreground">
                <FileVideo className="h-5 w-5" />
              </span>
            ) : (
              <Image src={value} alt="" fill className="object-cover" sizes="64px" unoptimized />
            )}
          </span>
        ) : (
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-lg border border-dashed border-border bg-muted text-muted-foreground">
            <ImageIcon className="h-5 w-5" />
          </span>
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:border-primary/40"
          >
            <ImageIcon className="h-4 w-4" />
            {label}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => setValue("")}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Video fields state the format + the 50 MB per-file cap enforced by
          uploadImage (MAX_BYTES_VIDEO) — the old silent limit was half the
          "MP4 upload doesn't work" confusion. */}
      <p className="text-xs text-muted-foreground">
        {accept === "video" ? "MP4 / WebM · ≤50 MB" : imageSizeHint(uploadDir)}
      </p>

      <MediaPicker
        open={open}
        onClose={() => setOpen(false)}
        onSelect={(path) => setValue(path)}
        scope={scope}
        uploadDir={uploadDir}
        accept={accept}
        locale={locale}
      />
    </div>
  );
}
