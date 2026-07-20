"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Copy, Loader2, Trash2, Upload, X } from "lucide-react";
import { deleteUpload, uploadImage, type MediaFile } from "@/lib/actions/uploads";

// Upload targets shown in the Media library. Each `slug` is the on-disk
// subfolder under /uploads/ (see uploadImage's `dir` param); the grid groups
// files by that first path segment so Cast & Crew / Catalog / Portfolio (and any
// legacy folder like projects/actors/kino) each get their own section.
const FOLDERS = [
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
  kino: "Demo — frames/posters",
  hero: "Demo — hero banners",
  misc: "Misc",
};

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

export function MediaManager({ files }: { files: MediaFile[] }) {
  const [items, setItems] = useState(files);
  const [copied, setCopied] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const [folder, setFolder] = useState<string>(FOLDERS[0].slug);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Flat, sorted list used by the lightbox (keeps prev/next simple); the grid
  // renders the same items grouped by folder.
  const flat = items;

  const groups = useMemo(() => {
    const byFolder = new Map<string, MediaFile[]>();
    for (const f of items) {
      const g = folderOf(f.path);
      const arr = byFolder.get(g);
      if (arr) arr.push(f);
      else byFolder.set(g, [f]);
    }
    // Preferred folders first, then the rest alphabetically.
    const preferred: string[] = FOLDERS.map((f) => f.slug);
    return [...byFolder.entries()].sort(([a], [b]) => {
      const ia = preferred.indexOf(a);
      const ib = preferred.indexOf(b);
      if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      return a.localeCompare(b);
    });
  }, [items]);

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files || []);
    e.target.value = "";
    if (!picked.length) return;
    setError(null);
    startTransition(async () => {
      const added: MediaFile[] = [];
      for (const file of picked) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("dir", folder);
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
    setLightboxIndex((i) => (i === null ? null : (i - 1 + flat.length) % flat.length));
  }

  function showNext() {
    setLightboxIndex((i) => (i === null ? null : (i + 1) % flat.length));
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
  }, [lightboxIndex, flat.length]);

  const activeFile = lightboxIndex !== null ? flat[lightboxIndex] : null;

  return (
    <div className="space-y-8">
      {/* Uploader — pick a folder, then one or more images. */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1 block text-xs text-muted-foreground">Folder</span>
            <select
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50"
            >
              {FOLDERS.map((f) => (
                <option key={f.slug} value={f.slug}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {pending ? "Uploading…" : "Upload images"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={onPickFiles}
            className="hidden"
          />
          <p className="text-xs text-muted-foreground">
            JPG / PNG / WebP, up to 8 MB each. Files go to <code>/uploads/{folder}/</code>.
          </p>
        </div>
        {error && <p className="mt-2 text-xs text-primary">{error}</p>}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No uploaded files yet.</p>
      ) : (
        groups.map(([groupSlug, groupFiles]) => (
          <section key={groupSlug} className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">
              {FOLDER_LABEL[groupSlug] || groupSlug}{" "}
              <span className="text-muted-foreground">({groupFiles.length})</span>
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {groupFiles.map((f) => (
                <div key={f.path} className="overflow-hidden rounded-xl border border-border bg-card">
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(flat.findIndex((x) => x.path === f.path))}
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
          </section>
        ))
      )}

      {activeFile && lightboxIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxIndex(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
        >
          <p className="absolute top-4 left-1/2 -translate-x-1/2 text-sm text-white/80">
            {lightboxIndex + 1} / {flat.length}
          </p>
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            aria-label="Close"
            className="absolute top-4 right-4 grid h-9 w-9 place-items-center rounded-md text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
          {flat.length > 1 && (
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
          {flat.length > 1 && (
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
