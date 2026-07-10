"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { PLACEMENT_TYPE_VALUES } from "./form-shared";
import { ImageUploader } from "./image-uploader";
import { type ProjectFormState, type ProjectFormValues } from "./actions";

export type ProjectFormInitial = ProjectFormValues;

const EMPTY: ProjectFormInitial = {
  title: "",
  code: "",
  genre: "",
  synopsis: "",
  titleHy: "",
  titleRu: "",
  titleEn: "",
  synopsisHy: "",
  synopsisRu: "",
  synopsisEn: "",
  poster: "",
  gallery: "",
  format: "",
  studio: "",
  status: "PRE_PRODUCTION",
  releaseLabel: "",
  countries: "",
  audienceGender: "All",
  audienceAge: "",
  ageRating: "",
  projViews: "",
  budgetMinAmd: null,
  budgetMaxAmd: null,
  cpmMinAmd: null,
  cpmMaxAmd: null,
  priceMinAmd: null,
  priceMaxAmd: null,
  isActive: true,
  sortOrder: 0,
  applicationDeadline: "",
  releaseDate: "",
  platforms: "",
  placementType: "",
  priceNote: "",
  tagline: "",
  subgenre: "",
  references: "",
  cinemas: "",
};

const STATUS_OPTIONS = [
  { value: "PRE_PRODUCTION", label: "Pre-production" },
  { value: "FILMING", label: "Filming" },
  { value: "POST_PRODUCTION", label: "Post-production" },
  { value: "RELEASED", label: "Released" },
] as const;

const GENDER_OPTIONS = ["All", "Male", "Female"] as const;

const inputCls =
  "w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary";
const labelCls = "mb-1.5 block text-sm font-medium text-foreground";

/** number|null -> the value <input defaultValue> expects; null renders as an
 *  empty (unset) field. */
function numOrEmpty(n: number | null): number | string {
  return n ?? "";
}

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
  const [state, formAction, pending] = useActionState<ProjectFormState, FormData>(action, {});

  // On a failed submit (validation error), the server echoes back exactly
  // what the user typed in state.values — so re-rendering the form never
  // wipes the fields. Edit mode preboots from `initial`, create mode from
  // `EMPTY`; a returned `state.values` always wins once present.
  const data: ProjectFormInitial = state.values ?? initial ?? EMPTY;

  return (
    <form action={formAction} className="max-w-3xl space-y-8">
      {/* ── General ── */}
      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">General</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title *">
            <input name="title" defaultValue={data.title} className={inputCls} />
          </Field>
          <Field label="Code *">
            <input name="code" defaultValue={data.code} placeholder="#PP-2026-8540" className={inputCls} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Genre *">
            <input name="genre" defaultValue={data.genre} className={inputCls} />
          </Field>
          <Field label="Poster">
            <ImageUploader name="poster" dir="projects" initial={data.poster} label="Upload poster" />
          </Field>
        </div>
        <Field label="Synopsis *">
          <textarea name="synopsis" defaultValue={data.synopsis} rows={4} className={`${inputCls} resize-none`} />
        </Field>
        <Field label="Gallery (storyboard stills — up to 5 shown)">
          <ImageUploader name="gallery" dir="projects" multiple initial={data.gallery} label="Upload gallery images" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Format">
            <input name="format" defaultValue={data.format} placeholder="50 ep × 1m 15s" className={inputCls} />
          </Field>
          <Field label="Studio">
            <input name="studio" defaultValue={data.studio} className={inputCls} />
          </Field>
        </div>
      </section>

      {/* ── Translations ── */}
      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
          Translations (hy / ru / en)
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Title (HY)">
            <input name="titleHy" defaultValue={data.titleHy} className={inputCls} />
          </Field>
          <Field label="Title (RU)">
            <input name="titleRu" defaultValue={data.titleRu} className={inputCls} />
          </Field>
          <Field label="Title (EN)">
            <input name="titleEn" defaultValue={data.titleEn} className={inputCls} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Synopsis (HY)">
            <textarea name="synopsisHy" defaultValue={data.synopsisHy} rows={3} className={`${inputCls} resize-none`} />
          </Field>
          <Field label="Synopsis (RU)">
            <textarea name="synopsisRu" defaultValue={data.synopsisRu} rows={3} className={`${inputCls} resize-none`} />
          </Field>
          <Field label="Synopsis (EN)">
            <textarea name="synopsisEn" defaultValue={data.synopsisEn} rows={3} className={`${inputCls} resize-none`} />
          </Field>
        </div>
      </section>

      {/* ── Status & release ── */}
      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">Status & release</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Status">
            <select name="status" defaultValue={data.status} className={inputCls}>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Release label">
            <input name="releaseLabel" defaultValue={data.releaseLabel} placeholder="Q1 2027" className={inputCls} />
          </Field>
          <Field label="Countries">
            <input name="countries" defaultValue={data.countries} placeholder="US, UK, …" className={inputCls} />
          </Field>
        </div>
      </section>

      {/* ── Placement ── */}
      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">Placement</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Application deadline">
            <input
              name="applicationDeadline"
              type="date"
              defaultValue={data.applicationDeadline}
              className={inputCls}
            />
          </Field>
          <Field label="Release date">
            <input name="releaseDate" type="date" defaultValue={data.releaseDate} className={inputCls} />
          </Field>
          <Field label="Platforms">
            <input
              name="platforms"
              defaultValue={data.platforms}
              placeholder="YouTube, Kinodaran, TV"
              className={inputCls}
            />
          </Field>
          <Field label="Placement type">
            <select name="placementType" defaultValue={data.placementType} className={inputCls}>
              <option value="">—</option>
              {PLACEMENT_TYPE_VALUES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Price note (optional caption)">
            <input
              name="priceNote"
              defaultValue={data.priceNote}
              placeholder="/ scene"
              className={inputCls}
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Price min (AMD)">
            <input
              name="priceMinAmd"
              type="number"
              min={0}
              defaultValue={numOrEmpty(data.priceMinAmd)}
              className={inputCls}
            />
          </Field>
          <Field label="Price max (AMD)">
            <input
              name="priceMaxAmd"
              type="number"
              min={0}
              defaultValue={numOrEmpty(data.priceMaxAmd)}
              className={inputCls}
            />
          </Field>
        </div>
        <p className="text-xs text-muted-foreground">
          Leave price empty → the site shows &ldquo;Price on request&rdquo;.
        </p>
      </section>

      {/* ── Audience & value ── */}
      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">Audience & value</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Audience gender">
            <select name="audienceGender" defaultValue={data.audienceGender} className={inputCls}>
              {GENDER_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Audience age">
            <input name="audienceAge" defaultValue={data.audienceAge} placeholder="16-30" className={inputCls} />
          </Field>
          <Field label="Age rating (poster badge)">
            <input name="ageRating" defaultValue={data.ageRating} placeholder="16+" className={inputCls} />
          </Field>
          <Field label="Projected views">
            <input name="projViews" defaultValue={data.projViews} placeholder="2.4M" className={inputCls} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="CPM min (AMD)">
            <input
              name="cpmMinAmd"
              type="number"
              min={0}
              defaultValue={numOrEmpty(data.cpmMinAmd)}
              className={inputCls}
            />
          </Field>
          <Field label="CPM max (AMD)">
            <input
              name="cpmMaxAmd"
              type="number"
              min={0}
              defaultValue={numOrEmpty(data.cpmMaxAmd)}
              className={inputCls}
            />
          </Field>
          <Field label="Budget min (AMD)">
            <input
              name="budgetMinAmd"
              type="number"
              min={0}
              defaultValue={numOrEmpty(data.budgetMinAmd)}
              className={inputCls}
            />
          </Field>
          <Field label="Budget max (AMD)">
            <input
              name="budgetMaxAmd"
              type="number"
              min={0}
              defaultValue={numOrEmpty(data.budgetMaxAmd)}
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      {/* ── Press-kit details ── */}
      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
          Press-kit details
        </h2>
        <Field label="Tagline / logline (one line, shown in the hero)">
          <input
            name="tagline"
            defaultValue={data.tagline}
            placeholder="A star is born — and fame has a price."
            className={inputCls}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Subgenre (shown next to genre)">
            <input name="subgenre" defaultValue={data.subgenre} placeholder="Musical" className={inputCls} />
          </Field>
          <Field label="Comparable titles (comma-separated)">
            <input
              name="references"
              defaultValue={data.references}
              placeholder="Bohemian Rhapsody, Ray, Michael"
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="Cinemas / exhibition venues (comma-separated)">
          <input
            name="cinemas"
            defaultValue={data.cinemas}
            placeholder="Cinema Star, Moscow Cinema, Kino Park"
            className={inputCls}
          />
        </Field>
      </section>

      {/* ── Visibility ── */}
      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">Visibility</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="inline-flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" name="isActive" defaultChecked={data.isActive} className="h-4 w-4 accent-primary" />
            Active (show in catalog)
          </label>
          <Field label="Sort order">
            <input name="sortOrder" type="number" defaultValue={data.sortOrder} className={inputCls} />
          </Field>
        </div>
      </section>

      {state.error && (
        <p className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm text-primary">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-70"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </button>
        <Link href="/admin/projects" className="text-sm text-muted-foreground hover:text-foreground">
          Cancel
        </Link>
      </div>
    </form>
  );
}
