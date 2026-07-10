"use client";

import { useState } from "react";
import Image from "next/image";
import { Copy, Trash2 } from "lucide-react";
import { deleteUpload, type MediaFile } from "@/lib/actions/uploads";

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaManager({ files }: { files: MediaFile[] }) {
  const [items, setItems] = useState(files);
  const [copied, setCopied] = useState<string | null>(null);

  async function remove(path: string) {
    setItems((prev) => prev.filter((f) => f.path !== path));
    await deleteUpload(path);
  }

  function copy(path: string) {
    navigator.clipboard?.writeText(path);
    setCopied(path);
    setTimeout(() => setCopied((c) => (c === path ? null : c)), 1500);
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No uploaded files yet.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((f) => (
        <div key={f.path} className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="relative aspect-square bg-muted">
            <Image src={f.path} alt="" fill className="object-cover" sizes="200px" unoptimized />
          </div>
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
  );
}
