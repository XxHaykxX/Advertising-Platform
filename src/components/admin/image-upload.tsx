"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, ImagePlus } from "lucide-react";

async function uploadFile(file: File, type: string): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("type", type);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Ошибка загрузки");
  return json.path as string;
}

/* Controlled image picker (value/onChange) — for use inside repeater rows. */
export function ImagePicker({
  value,
  onChange,
  type,
  size = "h-20 w-20",
}: {
  value: string;
  onChange: (path: string) => void;
  type: string;
  size?: string;
}) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      onChange(await uploadFile(file, type));
    } catch {
      /* ignore — keep previous value */
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={`relative ${size} shrink-0`}>
      {value ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className={`${size} rounded-full object-cover ring-1 ring-white/15`} />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-black/80 text-white ring-1 ring-white/20"
            aria-label="Удалить фото"
          >
            <X className="h-3 w-3" />
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className={`${size} grid place-items-center rounded-full border border-dashed border-white/20 bg-white/[0.02] text-white/40 hover:border-primary/40`}
          aria-label="Загрузить фото"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onPick}
        className="hidden"
      />
    </div>
  );
}

/* Single image field. Submits the uploaded path via a hidden input[name]. */
export function ImageUpload({
  name,
  type,
  defaultValue = "",
  label,
}: {
  name: string;
  type: string;
  defaultValue?: string;
  label?: string;
}) {
  const [path, setPath] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      setPath(await uploadFile(file, type));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-white/80">
          {label}
        </span>
      )}
      <input type="hidden" name={name} value={path} />

      {path ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={path}
            alt=""
            className="h-32 w-auto rounded-lg border border-white/10 object-cover"
          />
          <button
            type="button"
            onClick={() => setPath("")}
            className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-black/80 text-white ring-1 ring-white/20 hover:bg-black"
            aria-label="Удалить"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex h-32 w-48 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 bg-white/[0.02] text-white/50 transition-colors hover:border-primary/40 hover:text-white/80 disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Upload className="h-6 w-6" />
          )}
          <span className="text-xs">{busy ? "Загрузка…" : "Загрузить"}</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onPick}
        className="hidden"
      />
      {error && <p className="mt-1.5 text-xs text-primary">{error}</p>}
    </div>
  );
}

/* Multiple images. Submits a JSON-array of paths via hidden input[name]. */
export function MultiImageUpload({
  name,
  type,
  defaultValue = [],
  label,
}: {
  name: string;
  type: string;
  defaultValue?: string[];
  label?: string;
}) {
  const [paths, setPaths] = useState<string[]>(defaultValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setBusy(true);
    setError("");
    try {
      const added: string[] = [];
      for (const f of files) added.push(await uploadFile(f, type));
      setPaths((p) => [...p, ...added]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(i: number) {
    setPaths((p) => p.filter((_, idx) => idx !== i));
  }

  return (
    <div>
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-white/80">
          {label}
        </span>
      )}
      <input type="hidden" name={name} value={JSON.stringify(paths)} />

      <div className="flex flex-wrap gap-3">
        {paths.map((p, i) => (
          <div key={`${p}-${i}`} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p}
              alt=""
              className="h-24 w-32 rounded-lg border border-white/10 object-cover"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-black/80 text-white ring-1 ring-white/20 hover:bg-black"
              aria-label="Удалить"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex h-24 w-32 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/20 bg-white/[0.02] text-white/50 transition-colors hover:border-primary/40 hover:text-white/80 disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ImagePlus className="h-5 w-5" />
          )}
          <span className="text-[11px]">{busy ? "Загрузка…" : "Добавить"}</span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={onPick}
        className="hidden"
      />
      {error && <p className="mt-1.5 text-xs text-primary">{error}</p>}
    </div>
  );
}
