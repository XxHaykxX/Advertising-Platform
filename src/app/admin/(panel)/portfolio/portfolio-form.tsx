"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { MultiImageUpload } from "@/components/admin/image-upload";
import type { FormState } from "./actions";

export type PortfolioInitial = {
  titleRu: string; titleEn: string; titleHy: string;
  descriptionRu: string; descriptionEn: string; descriptionHy: string;
  images: string[];
  videoType: string;
  videoUrl: string;
  videoFile: string;
  sortOrder: number;
  publisherId: number | null;
};

export type PublisherOption = { id: number; name: string };

const EMPTY: PortfolioInitial = {
  titleRu: "", titleEn: "", titleHy: "",
  descriptionRu: "", descriptionEn: "", descriptionHy: "",
  images: [], videoType: "youtube", videoUrl: "", videoFile: "", sortOrder: 0,
  publisherId: null,
};

const inputCls =
  "w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-foreground placeholder:text-white/35 outline-none transition-colors focus:border-primary/50";
const labelCls = "mb-1.5 block text-sm font-medium text-white/80";

export function PortfolioForm({
  action,
  initial,
  submitLabel,
  publishers,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  initial?: PortfolioInitial;
  submitLabel: string;
  publishers: PublisherOption[];
}) {
  const data = initial ?? EMPTY;
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});
  const [videoType, setVideoType] = useState(data.videoType);

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <label className="block">
          <span className={labelCls}>Title (RU) * — format «Brand × Film»</span>
          <input name="titleRu" defaultValue={data.titleRu} placeholder="AuraDrinks × Northern Wind" className={inputCls} />
        </label>
        <label className="block">
          <span className={labelCls}>Description (RU)</span>
          <textarea name="descriptionRu" defaultValue={data.descriptionRu} rows={3} className={`${inputCls} resize-none`} />
        </label>
        <details className="rounded-lg border border-white/10 bg-black/20 p-4">
          <summary className="cursor-pointer text-sm text-white/60">Translations (EN / HY)</summary>
          <div className="mt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="titleEn" defaultValue={data.titleEn} placeholder="title EN" className={inputCls} />
              <input name="titleHy" defaultValue={data.titleHy} placeholder="title HY" className={inputCls} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <textarea name="descriptionEn" defaultValue={data.descriptionEn} placeholder="description EN" rows={2} className={`${inputCls} resize-none`} />
              <textarea name="descriptionHy" defaultValue={data.descriptionHy} placeholder="description HY" rows={2} className={`${inputCls} resize-none`} />
            </div>
          </div>
        </details>
      </section>

      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <MultiImageUpload name="images" type="portfolio" defaultValue={data.images} label="Case photo" />
      </section>

      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">Video</h2>
        <label className="block">
          <span className={labelCls}>Video type</span>
          <select name="videoType" value={videoType} onChange={(e) => setVideoType(e.target.value)} className={`${inputCls} appearance-none`}>
            <option value="youtube" className="bg-[#141414]">YouTube link</option>
            <option value="file" className="bg-[#141414]">File (URL)</option>
          </select>
        </label>
        {videoType === "youtube" ? (
          <label className="block">
            <span className={labelCls}>YouTube URL</span>
            <input name="videoUrl" defaultValue={data.videoUrl} placeholder="https://www.youtube.com/watch?v=..." className={inputCls} />
          </label>
        ) : (
          <label className="block">
            <span className={labelCls}>Video file URL</span>
            <input name="videoFile" defaultValue={data.videoFile} placeholder="/uploads/... or external URL" className={inputCls} />
          </label>
        )}
      </section>

      <section className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:grid-cols-2">
        <label className="block max-w-[200px]">
          <span className={labelCls}>Sort order</span>
          <input name="sortOrder" type="number" defaultValue={data.sortOrder} className={inputCls} />
        </label>
        <label className="block">
          <span className={labelCls}>Publisher (optional)</span>
          <select name="publisherId" defaultValue={data.publisherId ?? ""} className={`${inputCls} appearance-none`}>
            <option value="" className="bg-[#141414]">— None —</option>
            {publishers.map((p) => (
              <option key={p.id} value={p.id} className="bg-[#141414]">{p.name}</option>
            ))}
          </select>
        </label>
      </section>

      {state.error && (
        <p className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm text-primary">{state.error}</p>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-red-600 disabled:opacity-70">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </button>
        <Link href="/admin/portfolio" className="text-sm text-white/60 hover:text-white">Cancel</Link>
      </div>
    </form>
  );
}
