"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Loader2, Upload, X } from "lucide-react";
import { listUploads, uploadImage, type MediaFile } from "@/lib/actions/uploads";
import { listMemberUploads, uploadMemberImage } from "@/lib/actions/member-uploads";

// Reusable image picker modal. Opens a library of existing uploads and lets you
// either pick one or upload a new file from the computer — the chosen /uploads/…
// path is handed back via onSelect. Two scopes:
//  - "staff": the whole media library (listUploads / uploadImage), folder chips.
//  - "member": only the current member's own uploads (listMemberUploads /
//    uploadMemberImage) — a creator never sees anyone else's files.
export type MediaPickerScope = "staff" | "member";

function folderOf(path: string): string {
  const parts = path.split("/").filter(Boolean); // ["uploads","<folder>",...]
  return parts.length >= 3 ? parts[1] : "misc";
}

export function MediaPicker({
  open,
  onClose,
  onSelect,
  scope = "staff",
  uploadDir,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (path: string) => void;
  scope?: MediaPickerScope;
  /** Subfolder new uploads go into (staff: /uploads/<dir>/…, member: inside
   *  their own namespace). */
  uploadDir: string;
}) {
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
        if (alive) setError("Couldn't load the library.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, scope]);

  // Folder chips (staff only — a member's flat namespace needs no filter).
  const folders = useMemo(() => {
    if (scope !== "staff") return [];
    return [...new Set(items.map((f) => folderOf(f.path)))].sort();
  }, [items, scope]);

  const visible = useMemo(() => {
    if (scope !== "staff" || filter === "__all__") return items;
    return items.filter((f) => folderOf(f.path) === filter);
  }, [items, filter, scope]);

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
        fd.append("dir", uploadDir);
        const res = await upload(fd);
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
          <h2 className="text-sm font-semibold text-foreground">Choose image</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Upload from computer
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={onPickFiles}
              className="hidden"
            />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
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
                {f === "__all__" ? "All" : f}
              </button>
            ))}
          </div>
        )}

        <div className="min-h-[200px] flex-1 overflow-y-auto p-5">
          {error && <p className="mb-3 text-xs text-primary">{error}</p>}
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : visible.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              No images yet — use “Upload from computer”.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {visible.map((f) => (
                <button
                  key={f.path}
                  type="button"
                  onClick={() => {
                    onSelect(f.path);
                    onClose();
                  }}
                  className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted transition-colors hover:border-primary"
                  title={f.path}
                >
                  <Image src={f.path} alt="" fill className="object-cover" sizes="120px" unoptimized />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
