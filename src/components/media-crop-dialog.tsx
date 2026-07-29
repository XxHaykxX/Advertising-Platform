"use client";

import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Loader2, ZoomIn } from "lucide-react";
import type { Locale } from "@/lib/i18n";

/** Bounds the exported crop's longer side. A raw upload can be many
 *  megapixels and nothing in the app renders a still wider than this — mirrors
 *  the ~1600px width already used elsewhere for posters/stills. */
const MAX_EXPORT_SIDE = 1600;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", () => reject(new Error("Image failed to load")));
    img.src = src;
  });
}

/** Draws the selected crop region onto a canvas, downscaled to fit
 *  MAX_EXPORT_SIDE on its longer side, and returns a File with the source's
 *  own name. PNGs keep transparency (logos); everything else is re-encoded as
 *  JPEG, same as what the rest of the upload pipeline already expects. */
async function getCroppedFile(objectUrl: string, area: Area, sourceFile: File): Promise<File> {
  const image = await loadImage(objectUrl);
  const scale = Math.min(1, MAX_EXPORT_SIDE / Math.max(area.width, area.height));
  const outW = Math.max(1, Math.round(area.width * scale));
  const outH = Math.max(1, Math.round(area.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, outW, outH);

  const keepPng = sourceFile.type === "image/png";
  const mime = keepPng ? "image/png" : "image/jpeg";
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("canvas.toBlob failed"))), mime, keepPng ? undefined : 0.9);
  });

  return new File([blob], sourceFile.name, { type: mime });
}

/** Modal crop step inserted between "a file was dropped/picked" and "upload
 *  it": MediaField opens this instead of uploading straight away when it was
 *  given a `cropAspect`, and only hands the cropped result on to the existing
 *  upload path (see media-field.tsx). Shape follows the other dialogs in this
 *  folder (ConfirmDialog, NoteDialog) — fixed overlay, role="dialog",
 *  backdrop click and Escape to dismiss. */
export function MediaCropDialog({
  file,
  aspect,
  onCancel,
  onDone,
  locale,
  labels = {
    title: "Crop image",
    zoom: "Zoom",
    cancel: "Cancel",
    apply: "Apply",
  },
}: {
  /** null keeps the dialog mounted-but-closed so its own state (crop/zoom)
   *  resets cleanly the next time a file comes in, rather than being torn
   *  down and rebuilt by the caller each time. */
  file: File | null;
  aspect: number;
  onCancel: () => void;
  onDone: (file: File) => void;
  /** Accepted for parity with MediaField/MediaPicker's own `locale` prop —
   *  the caller passes it through in case a future copy tweak needs it.
   *  Labels themselves already arrive pre-translated via `labels`. */
  locale?: Locale;
  labels?: { title: string; zoom: string; cancel: string; apply: string; hint?: string };
}) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [pending, setPending] = useState(false);

  // Fresh object URL per file, and crop/zoom reset with it — otherwise a
  // second image would reopen at the first one's pan/zoom position.
  useEffect(() => {
    if (!file) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!file) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !pending) onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [file, pending, onCancel]);

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  async function handleApply() {
    if (!file || !objectUrl || !croppedAreaPixels) return;
    setPending(true);
    try {
      const cropped = await getCroppedFile(objectUrl, croppedAreaPixels, file);
      onDone(cropped);
    } finally {
      setPending(false);
    }
  }

  if (!file || !objectUrl) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={() => !pending && onCancel()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
      >
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold text-foreground">{labels.title}</h2>
          {labels.hint ? <p className="mt-1 text-xs text-muted-foreground">{labels.hint}</p> : null}
        </div>

        {/* react-easy-crop fills its relatively positioned parent, so it needs
            an explicit height. The dimmed area outside the crop frame is
            Cropper's own overlay — no extra styling needed here. */}
        <div className="relative h-[420px] w-full bg-black">
          <Cropper
            image={objectUrl}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            zoomWithScroll
          />
        </div>

        <div className="flex items-center gap-3 border-t border-border px-5 py-4">
          <ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <label htmlFor="media-crop-zoom" className="sr-only">
            {labels.zoom}
          </label>
          <input
            id="media-crop-zoom"
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
          >
            {labels.cancel}
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={pending || !croppedAreaPixels}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-60"
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {labels.apply}
          </button>
        </div>
      </div>
    </div>
  );
}
