"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, Trash2, Upload } from "lucide-react";
import { uploadImage } from "@/lib/actions/uploads";

/** File-upload replacement for the old URL text fields. Uploaded paths are
 *  mirrored into a hidden <input> so the existing form plumbing (poster string /
 *  newline-joined gallery) keeps working unchanged. */
export function ImageUploader({
  name,
  dir,
  multiple = false,
  initial = "",
  label,
  onChange,
}: {
  name?: string; // when set, mirrors value into a hidden form field
  dir: string;
  multiple?: boolean;
  initial?: string; // single path, or newline-joined paths for multiple
  label: string;
  onChange?: (paths: string[]) => void; // controlled mode (e.g. sub-editor rows)
}) {
  const [paths, setPaths] = useState<string[]>(
    initial ? initial.split("\n").map((s) => s.trim()).filter(Boolean) : [],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function commit(next: string[]) {
    setPaths(next);
    onChange?.(next);
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow re-picking the same file
    if (files.length === 0) return;
    setBusy(true);
    setError("");
    const added: string[] = [];
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("dir", dir);
      const res = await uploadImage(fd);
      if (res.error) {
        setError(res.error);
      } else if (res.path) {
        added.push(res.path);
      }
    }
    commit(multiple ? [...paths, ...added] : added.slice(-1));
    setBusy(false);
  }

  function removeAt(i: number) {
    commit(paths.filter((_, idx) => idx !== i));
  }

  const hiddenValue = multiple ? paths.join("\n") : paths[0] ?? "";

  return (
    <div className="space-y-3">
      {name ? <input type="hidden" name={name} value={hiddenValue} /> : null}
      <div className="flex items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:border-primary/40">
          <Upload className="h-4 w-4" />
          {label}
          <input type="file" accept="image/*" multiple={multiple} onChange={onPick} className="hidden" />
        </label>
        {busy && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
      </div>

      {error && <p className="text-xs text-primary">{error}</p>}

      {paths.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {paths.map((p, i) => (
            <div
              key={p}
              className="group relative h-24 w-24 overflow-hidden rounded-lg border border-border bg-muted"
            >
              <Image src={p} alt="" fill className="object-cover" sizes="96px" unoptimized />
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label="Remove"
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-md bg-background/80 text-muted-foreground opacity-0 transition-opacity hover:text-primary group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
