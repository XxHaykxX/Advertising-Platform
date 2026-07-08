"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { PLACEMENT_TYPE_VALUES, type ProjectFormState, type ProjectFormValues } from "./actions";

export type ProjectFormInitial = ProjectFormValues;

const EMPTY: ProjectFormInitial = {
  title: "",
  code: "",
  genre: "",
  synopsis: "",
  poster: "",
  format: "",
  studio: "",
  status: "PRE_PRODUCTION",
  releaseLabel: "",
  countries: "",
  audienceGender: "All",
  audienceAge: "",
  projViews: "",
  cpmRange: "",
  budgetRange: "",
  safetyScore: 0,
  safety: "REVIEW",
  isActive: true,
  sortOrder: 0,
  slotsTotal: 5,
  slotsTaken: 0,
  applicationDeadline: "",
  releaseDate: "",
  platforms: "",
  placementType: "",
  priceNote: "",
};

const STATUS_OPTIONS = [
  { value: "PRE_PRODUCTION", label: "Pre-production" },
  { value: "FILMING", label: "Filming" },
  { value: "POST_PRODUCTION", label: "Post-production" },
  { value: "RELEASED", label: "Released" },
] as const;

const SAFETY_OPTIONS = [
  { value: "SAFE", label: "Safe" },
  { value: "REVIEW", label: "Review" },
  { value: "RISK", label: "Risk" },
] as const;

const GENDER_OPTIONS = ["All", "Male", "Female"] as const;

const inputCls =
  "w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary";
const labelCls = "mb-1.5 block text-sm font-medium text-foreground";

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
          <Field label="Poster URL">
            <input name="poster" defaultValue={data.poster} placeholder="https://…" className={inputCls} />
          </Field>
        </div>
        <Field label="Synopsis *">
          <textarea name="synopsis" defaultValue={data.synopsis} rows={4} className={`${inputCls} resize-none`} />
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
          <Field label="Slots total">
            <input
              name="slotsTotal"
              type="number"
              min={0}
              defaultValue={data.slotsTotal}
              className={inputCls}
            />
          </Field>
          <Field label="Slots taken">
            <input
              name="slotsTaken"
              type="number"
              min={0}
              defaultValue={data.slotsTaken}
              className={inputCls}
            />
          </Field>
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
          <Field label="Price note">
            <input
              name="priceNote"
              defaultValue={data.priceNote}
              placeholder="Price on request"
              className={inputCls}
            />
          </Field>
        </div>
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
          <Field label="Projected views">
            <input name="projViews" defaultValue={data.projViews} placeholder="2.4M" className={inputCls} />
          </Field>
          <Field label="CPM range">
            <input name="cpmRange" defaultValue={data.cpmRange} placeholder="$3.60-$5.40" className={inputCls} />
          </Field>
          <Field label="Budget range">
            <input
              name="budgetRange"
              defaultValue={data.budgetRange}
              placeholder="$6,000,000 — $10,000,000"
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      {/* ── Brand safety ── */}
      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">Brand safety</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Safety score (0-100)">
            <input
              name="safetyScore"
              type="number"
              min={0}
              max={100}
              defaultValue={data.safetyScore}
              className={inputCls}
            />
          </Field>
          <Field label="Safety level">
            <select name="safety" defaultValue={data.safety} className={inputCls}>
              {SAFETY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
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
