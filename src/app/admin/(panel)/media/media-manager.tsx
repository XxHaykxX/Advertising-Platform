"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Copy, Trash2, X } from "lucide-react";
import { deleteUpload, type MediaFile } from "@/lib/actions/uploads";

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaManager({ files }: { files: MediaFile[] }) {
  const [items, setItems] = useState(files);
  const [copied, setCopied] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  async function remove(path: string) {
    setItems((prev) => {
      const next = prev.filter((f) => f.path !== path);
      const removedIndex = prev.findIndex((f) => f.path === path);
      setLightboxIndex((i) => {
        if (i === null || removedIndex === -1) return i;
        if (next.length === 0) return null;
        if (removedIndex < i) return i - 1;
        if (removedIndex === i) return Math.min(i, next.length - 1);
        return i;
      });
      return next;
    });
    await deleteUpload(path);
  }

  function copy(path: string) {
    navigator.clipboard?.writeText(path);
    setCopied(path);
    setTimeout(() => setCopied((c) => (c === path ? null : c)), 1500);
  }

  function showPrev() {
    setLightboxIndex((i) => (i === null ? null : (i - 1 + items.length) % items.length));
  }

  function showNext() {
    setLightboxIndex((i) => (i === null ? null : (i + 1) % items.length));
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
  }, [lightboxIndex, items.length]);

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No uploaded files yet.</p>;
  }

  const activeFile = lightboxIndex !== null ? items[lightboxIndex] : null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((f, i) => (
        <div key={f.path} className="overflow-hidden rounded-xl border border-border bg-card">
          <button
            type="button"
            onClick={() => setLightboxIndex(i)}
            aria-label="View image"
            className="relative block aspect-square w-full bg-muted"
          >
            <Image src={f.path} alt="" fill className="object-cover" sizes="200px" unoptimized />
          </button>
          <div className="space-y-2 p-3">
            <p className="truncate text-xs text-muted-foreground" title={f.path}>
              {f.path}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{humanSize(f.size)}</span>
              <div className="flex items-center gap-1">
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
                  onClick={() => remove(f.path)}
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

      {activeFile && lightboxIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxIndex(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
        >
          <p className="absolute top-4 left-1/2 -translate-x-1/2 text-sm text-white/80">
            {lightboxIndex + 1} / {items.length}
          </p>
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            aria-label="Close"
            className="absolute top-4 right-4 grid h-9 w-9 place-items-center rounded-md text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
          {items.length > 1 && (
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
            <Image
              src={activeFile.path}
              alt=""
              fill
              className="object-contain"
              sizes="80vw"
              unoptimized
            />
          </div>
          {items.length > 1 && (
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
    </div>
  );
}
