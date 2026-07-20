"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Copy,
  Folder,
  Images,
  Loader2,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { deleteUpload, uploadImage, type MediaFile } from "@/lib/actions/uploads";

// Folders that always appear (even when empty) so you can open one and upload
// into it. `slug` is the on-disk subfolder under /uploads/ (uploadImage `dir`).
const CANONICAL = [
  { slug: "cast-crew", label: "Cast & Crew" },
  { slug: "catalog", label: "Catalog" },
  { slug: "portfolio", label: "Portfolio" },
] as const;

const FOLDER_LABEL: Record<string, string> = {
  "cast-crew": "Cast & Crew",
  catalog: "Catalog",
  portfolio: "Portfolio",
  actors: "Cast & Crew (legacy)",
  projects: "Catalog (project posters)",
  kino: "Demo — frames / posters",
  hero: "Demo — hero banners",
  misc: "Misc",
};

const ALL = "__all__";

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
  const [items, setItems] = useState(files);
  // null = root (folder list); ALL = every file; otherwise a folder slug.
  const [open, setOpen] = useState<string | null>(null);

  const [copied, setCopied] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files || []);
    e.target.value = "";
    if (!picked.length || !open || open === ALL) return;
    const dir = open;
    setError(null);
    startTransition(async () => {
      const added: MediaFile[] = [];
      for (const file of picked) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("dir", dir);
        const res = await uploadImage(fd);
        if (res.error) {
          setError(res.error);
          continue;
        }
        if (res.path) added.push({ path: res.path, size: file.size, mtime: Date.now() });
      }
      if (added.length) setItems((prev) => [...added, ...prev]);
    });
  }

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
    setLightboxIndex((i) => (i === null ? null : (i - 1 + visible.length) % visible.length));
  }
  function showNext() {
    setLightboxIndex((i) => (i === null ? null : (i + 1) % visible.length));
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
  }, [lightboxIndex, visible.length]);

  const activeFile = lightboxIndex !== null ? visible[lightboxIndex] : null;

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
                  <span className="relative h-10 w-10 overflow-hidden rounded-md bg-muted">
                    <Image src={thumb} alt="" fill className="object-cover" sizes="40px" unoptimized />
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
    <div className="space-y-4">
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
          <span className="text-muted-foreground">({visible.length})</span>
        </h2>

        {inFolder && (
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {pending ? "Uploading…" : "Upload here"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={onPickFiles}
              className="hidden"
            />
          </div>
        )}
      </div>

      {inFolder && (
        <p className="text-xs text-muted-foreground">
          JPG / PNG / WebP, up to 8 MB each. Files go to <code>/uploads/{open}/</code>.
        </p>
      )}
      {error && <p className="text-xs text-primary">{error}</p>}

      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {inFolder ? "Empty folder — upload images with the button above." : "No files."}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((f, i) => (
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
            {lightboxIndex + 1} / {visible.length}
          </p>
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            aria-label="Close"
            className="absolute top-4 right-4 grid h-9 w-9 place-items-center rounded-md text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
          {visible.length > 1 && (
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
            <Image src={activeFile.path} alt="" fill className="object-contain" sizes="80vw" unoptimized />
          </div>
          {visible.length > 1 && (
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
