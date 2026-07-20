"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageIcon, X } from "lucide-react";
import { MediaPicker, type MediaPickerScope } from "@/components/media-picker";
import { imageSizeHint } from "@/lib/images/size-hint";

// Drop-in replacement for the old "<input> a URL" image fields (partner logo,
// portfolio image, …). Mirrors the chosen /uploads/… path into a hidden input
// so the existing form plumbing (a plain string field) keeps working unchanged.
// Clicking Browse opens the shared MediaPicker (pick existing or upload new).
export function MediaField({
  name,
  initial = "",
  label = "Browse",
  uploadDir,
  scope = "staff",
}: {
  name: string;
  initial?: string;
  label?: string;
  uploadDir: string;
  scope?: MediaPickerScope;
}) {
  const [value, setValue] = useState(initial);
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={value} />
      <div className="flex items-center gap-3">
        {value ? (
          <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
            <Image src={value} alt="" fill className="object-cover" sizes="64px" unoptimized />
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

      <p className="text-xs text-muted-foreground">{imageSizeHint(uploadDir)}</p>

      <MediaPicker
        open={open}
        onClose={() => setOpen(false)}
        onSelect={(path) => setValue(path)}
        scope={scope}
        uploadDir={uploadDir}
      />
    </div>
  );
}
