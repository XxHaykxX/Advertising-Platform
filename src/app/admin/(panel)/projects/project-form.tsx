"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { GENRES, PLATFORMS } from "@/lib/constants";
import {
  ImageUpload,
  MultiImageUpload,
  ImagePicker,
} from "@/components/admin/image-upload";
import type { ProjectFormState } from "./actions";

export type ProjectFormInitial = {
  titleRu: string; titleEn: string; titleHy: string;
  genreRu: string; genreEn: string; genreHy: string;
  descriptionRu: string; descriptionEn: string; descriptionHy: string;
  placementTypeRu: string; placementTypeEn: string; placementTypeHy: string;
  poster: string;
  gallery: string[];
  price: string; currency: string;
  slotsTotal: number; slotsAvailable: number;
  releaseDate: string; // yyyy-mm-dd
  bookingDeadline: string; // yyyy-mm-dd
  platforms: string[];
  sortOrder: number;
  isActive: boolean;
  actors: {
    firstName: string; firstNameEn: string; firstNameHy: string;
    lastName: string; lastNameEn: string; lastNameHy: string;
    role: string; roleEn: string; roleHy: string;
    photo: string;
  }[];
  scenes: {
    title: string; titleEn: string; titleHy: string;
    description: string; descriptionEn: string; descriptionHy: string;
    placement: string; placementEn: string; placementHy: string;
  }[];
};

const EMPTY: ProjectFormInitial = {
  titleRu: "", titleEn: "", titleHy: "",
  genreRu: "", genreEn: "", genreHy: "",
  descriptionRu: "", descriptionEn: "", descriptionHy: "",
  placementTypeRu: "", placementTypeEn: "", placementTypeHy: "",
  poster: "", gallery: [], price: "", currency: "",
  slotsTotal: 0, slotsAvailable: 0, releaseDate: "", bookingDeadline: "",
  platforms: [], sortOrder: 0, isActive: true, actors: [], scenes: [],
};

const inputCls =
  "w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-foreground placeholder:text-white/35 outline-none transition-colors focus:border-primary/50";
const labelCls = "mb-1.5 block text-sm font-medium text-white/80";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      {children}
    </label>
  );
}

export function ProjectForm({
  action,
  initial,
  submitLabel,
}: {
  action: (prev: ProjectFormState, fd: FormData) => Promise<ProjectFormState>;
  initial?: ProjectFormInitial;
  submitLabel: string;
}) {
  const data = initial ?? EMPTY;
  const [state, formAction, pending] = useActionState<ProjectFormState, FormData>(
    action,
    {},
  );

  const [actors, setActors] = useState(data.actors);
  const [scenes, setScenes] = useState(data.scenes);

  return (
    <form action={formAction} className="max-w-3xl space-y-8">
      {/* ── General ── */}
      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
          General
        </h2>
        <Field label="Title (RU) *">
          <input name="titleRu" defaultValue={data.titleRu} className={inputCls} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Genre (RU)">
            <input name="genreRu" defaultValue={data.genreRu} list="genres" className={inputCls} />
            <datalist id="genres">
              {GENRES.map((g) => (
                <option key={g} value={g} />
              ))}
            </datalist>
          </Field>
          <Field label="Placement type (RU)">
            <input name="placementTypeRu" defaultValue={data.placementTypeRu} className={inputCls} />
          </Field>
        </div>
        <Field label="Description (RU)">
          <textarea name="descriptionRu" defaultValue={data.descriptionRu} rows={3} className={`${inputCls} resize-none`} />
        </Field>

        <details className="rounded-lg border border-white/10 bg-black/20 p-4">
          <summary className="cursor-pointer text-sm text-white/60">Translations (EN / HY)</summary>
          <div className="mt-4 space-y-3">
            {(["title", "genre", "placementType", "description"] as const).map((f) => (
              <div key={f} className="grid gap-3 sm:grid-cols-2">
                <input name={`${f}En`} defaultValue={data[`${f}En` as keyof ProjectFormInitial] as string} placeholder={`${f} EN`} className={inputCls} />
                <input name={`${f}Hy`} defaultValue={data[`${f}Hy` as keyof ProjectFormInitial] as string} placeholder={`${f} HY`} className={inputCls} />
              </div>
            ))}
          </div>
        </details>
      </section>

      {/* ── Media ── */}
      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">Media</h2>
        <ImageUpload name="poster" type="posters" defaultValue={data.poster} label="Poster" />
        <MultiImageUpload name="gallery" type="gallery" defaultValue={data.gallery} label="Frame gallery" />
      </section>

      {/* ── Parameters ── */}
      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">Parameters</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Price (opt.)">
            <input name="price" defaultValue={data.price} placeholder="on request" className={inputCls} />
          </Field>
          <Field label="Currency (opt.)">
            <input name="currency" defaultValue={data.currency} placeholder="RUB" className={inputCls} />
          </Field>
          <Field label="Total slots">
            <input name="slotsTotal" type="number" min={0} defaultValue={data.slotsTotal} className={inputCls} />
          </Field>
          <Field label="Available slots">
            <input name="slotsAvailable" type="number" min={0} defaultValue={data.slotsAvailable} className={inputCls} />
          </Field>
          <Field label="Release date">
            <input name="releaseDate" type="date" defaultValue={data.releaseDate} className={inputCls} />
          </Field>
          <Field label="Application deadline">
            <input name="bookingDeadline" type="date" defaultValue={data.bookingDeadline} className={inputCls} />
          </Field>
          <Field label="Sort order">
            <input name="sortOrder" type="number" defaultValue={data.sortOrder} className={inputCls} />
          </Field>
        </div>

        <div>
          <span className={labelCls}>Platforms</span>
          <div className="flex flex-wrap gap-3">
            {PLATFORMS.map((pl) => (
              <label key={pl} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80">
                <input type="checkbox" name="platforms" value={pl} defaultChecked={data.platforms.includes(pl)} className="h-4 w-4 accent-primary" />
                {pl}
              </label>
            ))}
          </div>
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-white/80">
          <input type="checkbox" name="isActive" defaultChecked={data.isActive} className="h-4 w-4 accent-primary" />
          Active (show on site)
        </label>
      </section>

      {/* ── Cast ── */}
      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">Cast</h2>
          <button type="button" onClick={() => setActors((a) => [...a, { firstName: "", firstNameEn: "", firstNameHy: "", lastName: "", lastNameEn: "", lastNameHy: "", role: "", roleEn: "", roleHy: "", photo: "" }])} className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/80 hover:border-primary/40">
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
        <input type="hidden" name="actors" value={JSON.stringify(actors)} />
        {actors.length === 0 && <p className="text-sm text-white/40">No cast.</p>}
        {actors.map((a, i) => (
          <div key={i} className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
            <ImagePicker value={a.photo} onChange={(p) => setActors((arr) => arr.map((x, idx) => (idx === i ? { ...x, photo: p } : x)))} type="actors" />
            <div className="flex-1 space-y-2">
              <div className="grid gap-2 sm:grid-cols-3">
                <input value={a.firstName} onChange={(e) => setActors((arr) => arr.map((x, idx) => (idx === i ? { ...x, firstName: e.target.value } : x)))} placeholder="First name (RU)" className={inputCls} />
                <input value={a.lastName} onChange={(e) => setActors((arr) => arr.map((x, idx) => (idx === i ? { ...x, lastName: e.target.value } : x)))} placeholder="Last name (RU)" className={inputCls} />
                <input value={a.role} onChange={(e) => setActors((arr) => arr.map((x, idx) => (idx === i ? { ...x, role: e.target.value } : x)))} placeholder="Role (RU)" className={inputCls} />
              </div>
              {/* EN / HY translations for actor */}
              <details className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <summary className="cursor-pointer text-xs text-white/50">EN / HY</summary>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <input value={a.firstNameEn} onChange={(e) => setActors((arr) => arr.map((x, idx) => (idx === i ? { ...x, firstNameEn: e.target.value } : x)))} placeholder="First name EN" className={inputCls} />
                  <input value={a.firstNameHy} onChange={(e) => setActors((arr) => arr.map((x, idx) => (idx === i ? { ...x, firstNameHy: e.target.value } : x)))} placeholder="First name HY" className={inputCls} />
                  <input value={a.lastNameEn} onChange={(e) => setActors((arr) => arr.map((x, idx) => (idx === i ? { ...x, lastNameEn: e.target.value } : x)))} placeholder="Last name EN" className={inputCls} />
                  <input value={a.lastNameHy} onChange={(e) => setActors((arr) => arr.map((x, idx) => (idx === i ? { ...x, lastNameHy: e.target.value } : x)))} placeholder="Last name HY" className={inputCls} />
                  <input value={a.roleEn} onChange={(e) => setActors((arr) => arr.map((x, idx) => (idx === i ? { ...x, roleEn: e.target.value } : x)))} placeholder="Role EN" className={inputCls} />
                  <input value={a.roleHy} onChange={(e) => setActors((arr) => arr.map((x, idx) => (idx === i ? { ...x, roleHy: e.target.value } : x)))} placeholder="Role HY" className={inputCls} />
                </div>
              </details>
            </div>
            <button type="button" onClick={() => setActors((arr) => arr.filter((_, idx) => idx !== i))} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white/40 hover:bg-white/5 hover:text-primary" aria-label="Delete">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </section>

      {/* ── Placement scenes ── */}
      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">Placement scenes</h2>
          <button type="button" onClick={() => setScenes((s) => [...s, { title: "", titleEn: "", titleHy: "", description: "", descriptionEn: "", descriptionHy: "", placement: "", placementEn: "", placementHy: "" }])} className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/80 hover:border-primary/40">
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
        <input type="hidden" name="scenes" value={JSON.stringify(scenes)} />
        {scenes.length === 0 && <p className="text-sm text-white/40">No scenes.</p>}
        {scenes.map((s, i) => (
          <div key={i} className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="flex items-center gap-2">
              <input value={s.title} onChange={(e) => setScenes((arr) => arr.map((x, idx) => (idx === i ? { ...x, title: e.target.value } : x)))} placeholder="Scene title (RU)" className={inputCls} />
              <button type="button" onClick={() => setScenes((arr) => arr.filter((_, idx) => idx !== i))} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white/40 hover:bg-white/5 hover:text-primary" aria-label="Delete">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <textarea value={s.description} onChange={(e) => setScenes((arr) => arr.map((x, idx) => (idx === i ? { ...x, description: e.target.value } : x)))} placeholder="Scene description (RU)" rows={2} className={`${inputCls} resize-none`} />
            <textarea value={s.placement} onChange={(e) => setScenes((arr) => arr.map((x, idx) => (idx === i ? { ...x, placement: e.target.value } : x)))} placeholder="What and where to place (RU)" rows={2} className={`${inputCls} resize-none`} />
            {/* EN / HY translations for scene */}
            <details className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
              <summary className="cursor-pointer text-xs text-white/50">EN / HY</summary>
              <div className="mt-2 space-y-2">
                <div className="grid gap-2 sm:grid-cols-2">
                  <input value={s.titleEn} onChange={(e) => setScenes((arr) => arr.map((x, idx) => (idx === i ? { ...x, titleEn: e.target.value } : x)))} placeholder="Title EN" className={inputCls} />
                  <input value={s.titleHy} onChange={(e) => setScenes((arr) => arr.map((x, idx) => (idx === i ? { ...x, titleHy: e.target.value } : x)))} placeholder="Title HY" className={inputCls} />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <textarea value={s.descriptionEn} onChange={(e) => setScenes((arr) => arr.map((x, idx) => (idx === i ? { ...x, descriptionEn: e.target.value } : x)))} placeholder="Description EN" rows={2} className={`${inputCls} resize-none`} />
                  <textarea value={s.descriptionHy} onChange={(e) => setScenes((arr) => arr.map((x, idx) => (idx === i ? { ...x, descriptionHy: e.target.value } : x)))} placeholder="Description HY" rows={2} className={`${inputCls} resize-none`} />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <textarea value={s.placementEn} onChange={(e) => setScenes((arr) => arr.map((x, idx) => (idx === i ? { ...x, placementEn: e.target.value } : x)))} placeholder="Placement EN" rows={2} className={`${inputCls} resize-none`} />
                  <textarea value={s.placementHy} onChange={(e) => setScenes((arr) => arr.map((x, idx) => (idx === i ? { ...x, placementHy: e.target.value } : x)))} placeholder="Placement HY" rows={2} className={`${inputCls} resize-none`} />
                </div>
              </div>
            </details>
          </div>
        ))}
      </section>

      {state.error && (
        <p className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm text-primary">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-red-600 disabled:opacity-70">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </button>
        <Link href="/admin/projects" className="text-sm text-white/60 hover:text-white">
          Cancel
        </Link>
      </div>
    </form>
  );
}
