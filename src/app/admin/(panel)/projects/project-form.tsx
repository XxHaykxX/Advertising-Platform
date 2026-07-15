"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Languages, Loader2, RotateCcw, Sparkles, X } from "lucide-react";
import { AGE_RATING_VALUES, KIND_VALUES, PLACEMENT_TYPE_VALUES, parseCsvInput } from "./form-shared";
import { ImageUploader, type ImageUploaderHandle } from "./image-uploader";
import { ActorsSection, type ActorRow } from "./actors-editor";
import { TiersSection, type TierRow } from "./tiers-editor";
import { MultiSelect } from "@/components/ui/multi-select";
import { PosterGenerator } from "@/components/poster-generator";
import { GENRES } from "@/lib/genres";
import { type ProjectFormState, type ProjectFormValues } from "./actions";
import { translateProjectAction, type TranslateProjectState } from "./translate-action";
import { generatePosterAction } from "./poster-action";
import { makeUI } from "@/lib/i18n";

// Admin panel chrome is English-only for now (see the rest of this form) —
// hardcode the "en" translator so the Translate button's copy still comes
// from the shared i18n dict (#21) instead of a one-off duplicate string.
const t = makeUI("en");

type TranslateLang = "hy" | "ru" | "en";

// Autosave draft (#20²) — create mode only. A single localStorage key holds a
// snapshot of the whole form so an accidental reload/navigation doesn't lose a
// half-typed project. Edit mode is never drafted (it has server truth). The
// snapshot is a flat name→value map (exactly what a FormData submit sends),
// captured off the live <form>; controlled widgets (MultiSelect, kind radios,
// cast/crew, tiers, image uploaders) all mirror into named hidden inputs, so
// one FormData pass captures everything uniformly.
const DRAFT_KEY = "igovazd:project-draft-v1";
// Field names owned by React state (restored via setState, not by writing to a
// DOM input) — skipped when replaying plain uncontrolled fields on restore.
const CONTROLLED_NAMES = new Set([
  "genres",
  "countries",
  "platforms",
  "cinemas",
  "kind",
  "actorsRows",
  "tiersRows",
  "poster",
  "gallery",
]);

export type ProjectFormInitial = ProjectFormValues;

const EMPTY: ProjectFormInitial = {
  title: "",
  code: "",
  genre: "",
  genres: [],
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
  kind: "FILM",
  episodes: null,
  episodeMinutes: null,
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

// NB: a plain <div>, NOT a <label>. Several fields wrap composite controls
// (ImageUploader's file <input>, the MultiSelect, radio groups, the poster
// panel). A <label> wrapping those makes a click ANYWHERE in the field —
// empty space, the caption, next to a button — get forwarded to the first
// labelable control inside: the file picker pops open, or a MultiSelect chip's
// remove button fires. Using a <div> (with a caption <span>) severs that
// implicit association and kills that whole class of mis-click bug.
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="block">
      <span className={labelCls}>{label}</span>
      {children}
    </div>
  );
}

export function ProjectForm({
  action,
  initial,
  initialActors = [],
  initialTiers = [],
  submitLabel,
  studios = [],
  projectId,
  ownerHasAvatar = false,
}: {
  action: (prev: ProjectFormState, fd: FormData) => Promise<ProjectFormState>;
  initial?: ProjectFormInitial;
  /** Cast & crew rows (#20²) — inline in this form now, saved in the same
   *  submit as the project. Empty on create. */
  initialActors?: ActorRow[];
  /** Sponsorship tier rows (#20²) — same story as initialActors. */
  initialTiers?: TierRow[];
  submitLabel: string;
  /** Distinct studio names already used elsewhere — powers a <datalist>
   *  autocomplete on the Studio field. */
  studios?: string[];
  /** Existing project id (edit mode only) — forwarded to generatePosterAction
   *  so the logo overlay can pull project.owner.avatar (#26). Unset on
   *  create: no owner yet, so the action falls back to the current staff
   *  user's own avatar. */
  projectId?: number;
  /** Whether the poster's future owner (project.owner on edit, the current
   *  staff user on create) has an avatar set — gates the "logo" checkbox in
   *  the poster generator panel. */
  ownerHasAvatar?: boolean;
}) {
  const [state, formAction, pending] = useActionState<ProjectFormState, FormData>(action, {});

  // On a failed submit (validation error), the server echoes back exactly
  // what the user typed in state.values — so re-rendering the form never
  // wipes the fields. Edit mode preboots from `initial`, create mode from
  // `EMPTY`; a returned `state.values` always wins once present.
  const data: ProjectFormInitial = state.values ?? initial ?? EMPTY;
  const isEdit = !!initial;

  // Bug fix (2026-07-15): the action returns { ok, redirect } instead of
  // calling redirect() itself (see actions.ts). Navigate client-side once the
  // save succeeds; keep the button in its pending/disabled look until the
  // navigation actually happens so it doesn't flicker back to "enabled" for
  // a frame in between.
  const navigating = !!(state.ok && state.redirect);
  useEffect(() => {
    if (navigating && state.redirect) {
      // A successful save supersedes any local draft.
      if (!isEdit) {
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch {
          /* ignore */
        }
      }
      window.location.assign(state.redirect);
    }
  }, [navigating, state.redirect, isEdit]);

  // ── Controlled fields that don't fit a plain <input defaultValue> ──
  const [genres, setGenres] = useState<string[]>(() => data.genres);
  const [kind, setKind] = useState<ProjectFormInitial["kind"]>(() => data.kind);
  const [countries, setCountries] = useState<string[]>(() => parseCsvInput(data.countries));
  const [platforms, setPlatforms] = useState<string[]>(() => parseCsvInput(data.platforms));
  const [cinemas, setCinemas] = useState<string[]>(() => parseCsvInput(data.cinemas));
  // ── Cast/crew + sponsorship tiers, inline (#20²) ──
  const [actors, setActors] = useState<ActorRow[]>(() => initialActors);
  const [tiers, setTiers] = useState<TierRow[]>(() => initialTiers);
  // Poster generator open state is lifted so its panel can render full-width
  // below the grid while the trigger stays compact in the Poster field.
  const [posterOpen, setPosterOpen] = useState(false);

  // ── Translate (#21): title/synopsis + hy/ru/en refs are plain uncontrolled
  // fields (defaultValue), so the "Translate" button fills the other two
  // languages by writing straight into the DOM via refs — no controlled
  // state needed, and the results stay freely editable afterwards, same as
  // any hand-typed value, since the native <form> reads .value at submit.
  const titleRef = useRef<HTMLInputElement>(null);
  const synopsisRef = useRef<HTMLTextAreaElement>(null);

  // ── Generate poster (#26) ── posterUploaderRef lets the panel push its
  // result straight into the (otherwise self-contained) poster ImageUploader
  // without lifting that component's state up. getDefaultPromptForPoster
  // reads the *current* title/genres/synopsis at the moment the panel first
  // opens (not a value frozen at mount) since title/synopsis are uncontrolled refs.
  const posterUploaderRef = useRef<ImageUploaderHandle>(null);
  function getDefaultPromptForPoster(): string {
    const title = titleRef.current?.value || data.title;
    const synopsis = synopsisRef.current?.value || data.synopsis;
    return [title, genres.join(", "), synopsis].filter(Boolean).join(". ");
  }

  const titleRefs: Record<TranslateLang, React.RefObject<HTMLInputElement | null>> = {
    hy: useRef<HTMLInputElement>(null),
    ru: useRef<HTMLInputElement>(null),
    en: useRef<HTMLInputElement>(null),
  };
  const synopsisRefs: Record<TranslateLang, React.RefObject<HTMLTextAreaElement | null>> = {
    hy: useRef<HTMLTextAreaElement>(null),
    ru: useRef<HTMLTextAreaElement>(null),
    en: useRef<HTMLTextAreaElement>(null),
  };
  const [translating, startTranslate] = useTransition();
  const [translateError, setTranslateError] = useState<NonNullable<TranslateProjectState["errorCode"]> | null>(null);

  // ── Autosave draft (#20², create only) ─────────────────────────────────
  const formRef = useRef<HTMLFormElement>(null);
  // A draft found in storage at mount → offer restore (don't clobber silently).
  const [draftFound, setDraftFound] = useState(false);
  // Poster/gallery ImageUploader seed everything from `initial` at mount; to
  // reflect a restored draft they must remount with a new initial — bump this
  // nonce (used as their React key) to force that.
  const [restoreNonce, setRestoreNonce] = useState(0);
  const [posterInitial, setPosterInitial] = useState(data.poster);
  const [galleryInitial, setGalleryInitial] = useState(data.gallery);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipFirstDraftEffect = useRef(true);
  // Plain uncontrolled fields to replay onto the DOM after a restore re-render.
  const pendingRestore = useRef<Record<string, string> | null>(null);

  // Detect an existing draft once, on mount (create mode only).
  useEffect(() => {
    if (isEdit) return;
    try {
      if (localStorage.getItem(DRAFT_KEY)) setDraftFound(true);
    } catch {
      /* ignore */
    }
  }, [isEdit]);

  function scheduleSaveDraft() {
    if (isEdit) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const form = formRef.current;
      if (!form) return;
      try {
        const snapshot: Record<string, string> = {};
        for (const [k, v] of new FormData(form).entries()) {
          if (typeof v === "string") snapshot[k] = v;
        }
        localStorage.setItem(DRAFT_KEY, JSON.stringify(snapshot));
      } catch {
        /* storage full / unavailable — drafting is best-effort */
      }
    }, 600);
  }

  // Re-save whenever a controlled widget changes (its hidden input has already
  // re-rendered by the time this effect runs, so the snapshot is current).
  // Skip the very first run so merely opening the form doesn't write a draft.
  useEffect(() => {
    if (isEdit) return;
    if (skipFirstDraftEffect.current) {
      skipFirstDraftEffect.current = false;
      return;
    }
    scheduleSaveDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genres, kind, countries, platforms, cinemas, actors, tiers]);

  // After a restore bumps restoreNonce, the form has re-rendered with the new
  // controlled state (and any conditional SERIAL fields now exist), so replay
  // the plain uncontrolled fields onto the live DOM.
  useEffect(() => {
    if (restoreNonce === 0) return;
    const form = formRef.current;
    const obj = pendingRestore.current;
    if (!form || !obj) return;
    for (const el of Array.from(form.elements)) {
      const field = el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      const name = field.name;
      if (!name || CONTROLLED_NAMES.has(name)) continue;
      if (field instanceof HTMLInputElement && field.type === "checkbox") {
        field.checked = obj[name] === "on";
      } else if (field instanceof HTMLInputElement && field.type === "file") {
        continue;
      } else {
        field.value = obj[name] ?? "";
      }
    }
    pendingRestore.current = null;
  }, [restoreNonce]);

  function restoreDraft() {
    let obj: Record<string, string>;
    try {
      obj = JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}");
    } catch {
      setDraftFound(false);
      return;
    }
    const parseArr = (s: string | undefined): string[] => {
      try {
        const a = JSON.parse(s || "[]");
        return Array.isArray(a) ? a : [];
      } catch {
        return [];
      }
    };
    // Controlled widgets ← state.
    setGenres(parseArr(obj.genres));
    setKind(obj.kind === "SERIAL" ? "SERIAL" : "FILM");
    setCountries(parseArr(obj.countries));
    setPlatforms(parseArr(obj.platforms));
    setCinemas(parseArr(obj.cinemas));
    setActors(parseArr(obj.actorsRows) as unknown as ActorRow[]);
    setTiers(parseArr(obj.tiersRows) as unknown as TierRow[]);
    // Image uploaders remount with the restored paths.
    setPosterInitial(obj.poster ?? "");
    setGalleryInitial(obj.gallery ?? "");
    // Plain fields replay after the re-render (see restoreNonce effect).
    pendingRestore.current = obj;
    setRestoreNonce((n) => n + 1);
    setDraftFound(false);
  }

  function discardDraft() {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
    setDraftFound(false);
  }

  function handleTranslate() {
    setTranslateError(null);
    // Source = whichever per-locale title field is already filled (ru first,
    // per spec default), falling back to the generic title/synopsis fields
    // above (treated as "ru") when none of hy/ru/en is filled yet.
    const langPriority: TranslateLang[] = ["ru", "hy", "en"];
    let sourceLang: TranslateLang = "ru";
    let sourceTitle = "";
    let sourceSynopsis = "";
    const hit = langPriority.find((l) => (titleRefs[l].current?.value || "").trim());
    if (hit) {
      sourceLang = hit;
      sourceTitle = titleRefs[hit].current?.value || "";
      sourceSynopsis = synopsisRefs[hit].current?.value || "";
    } else {
      sourceTitle = titleRef.current?.value || "";
      sourceSynopsis = synopsisRef.current?.value || "";
    }
    if (!sourceTitle.trim() && !sourceSynopsis.trim()) {
      setTranslateError("emptyFields");
      return;
    }

    const fd = new FormData();
    fd.set("sourceLang", sourceLang);
    fd.set("title", sourceTitle);
    fd.set("synopsis", sourceSynopsis);

    startTranslate(async () => {
      const res = await translateProjectAction(fd);
      if (res.errorCode) {
        setTranslateError(res.errorCode);
        return;
      }
      for (const [lang, value] of Object.entries(res.values || {})) {
        const l = lang as TranslateLang;
        if (titleRefs[l]?.current) titleRefs[l].current!.value = value.title;
        if (synopsisRefs[l]?.current) synopsisRefs[l].current!.value = value.synopsis;
      }
      scheduleSaveDraft();
    });
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      onInput={scheduleSaveDraft}
      className="max-w-5xl space-y-8"
    >
      {/* Hidden mirrors of the inline cast/crew + tier editors, submitted with
          the main form and parsed by create/updateProject (#20²). */}
      <input type="hidden" name="actorsRows" value={JSON.stringify(actors)} />
      <input type="hidden" name="tiersRows" value={JSON.stringify(tiers)} />

      {draftFound && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm">
          <span className="text-foreground">You have an unsaved draft from a previous session.</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={restoreDraft}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Restore draft
            </button>
            <button
              type="button"
              onClick={discardDraft}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary/40"
            >
              <X className="h-3.5 w-3.5" /> Discard
            </button>
          </div>
        </div>
      )}

      {/* ── General ── */}
      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">General</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title *">
            <input ref={titleRef} name="title" defaultValue={data.title} placeholder="A Star Is Born" className={inputCls} />
          </Field>
          <Field label="Code">
            {isEdit ? (
              <input name="code" defaultValue={data.code} readOnly className={`${inputCls} cursor-not-allowed opacity-70`} />
            ) : (
              <div className={`${inputCls} cursor-not-allowed text-muted-foreground`}>
                Generated automatically
              </div>
            )}
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Genre *">
            <MultiSelect
              options={GENRES}
              value={genres}
              onChange={setGenres}
              name="genres"
              placeholder="Select genres…"
            />
          </Field>
          <Field label="Poster">
            {/* "Upload poster" and the "Generate poster" trigger sit on ONE row
                (trailing slot) so the generate action stays next to upload even
                after a poster is uploaded (preview thumbs render below). The
                panel itself opens full-width below the grid. */}
            <ImageUploader
              key={`poster-${restoreNonce}`}
              ref={posterUploaderRef}
              name="poster"
              dir="projects"
              initial={posterInitial}
              label="Upload poster"
              trailing={
                <>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">or</span>
                  <button
                    type="button"
                    onClick={() => setPosterOpen(true)}
                    className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:border-primary/40"
                  >
                    <Sparkles className="h-4 w-4" />
                    {t("btn.generatePoster")}
                  </button>
                </>
              }
            />
          </Field>
        </div>
        <PosterGenerator
          hideTrigger
          open={posterOpen}
          onOpenChange={setPosterOpen}
          action={(input) => generatePosterAction({ ...input, projectId })}
          getDefaultPrompt={getDefaultPromptForPoster}
          hasOwnerAvatar={ownerHasAvatar}
          onUse={(path) => posterUploaderRef.current?.addPath(path)}
          t={t}
        />
        <Field label="Synopsis *">
          <textarea
            ref={synopsisRef}
            name="synopsis"
            defaultValue={data.synopsis}
            rows={4}
            placeholder="One-line logline, then what the story is about…"
            className={`${inputCls} resize-none`}
          />
        </Field>
        <Field label="Gallery (storyboard stills — up to 5 shown)">
          <ImageUploader
            key={`gallery-${restoreNonce}`}
            name="gallery"
            dir="projects"
            multiple
            initial={galleryInitial}
            label="Upload gallery images"
          />
        </Field>
        <Field label="Kind">
          <div className="flex gap-5 pt-1">
            {KIND_VALUES.map((k) => (
              <label key={k} className="inline-flex items-center gap-2 text-sm text-foreground">
                <input
                  type="radio"
                  name="kind"
                  value={k}
                  checked={kind === k}
                  onChange={() => setKind(k)}
                  className="h-4 w-4 accent-primary"
                />
                {k === "FILM" ? "Film" : "Serial"}
              </label>
            ))}
          </div>
        </Field>
        {kind === "SERIAL" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Episodes">
              <input
                name="episodes"
                type="number"
                min={0}
                defaultValue={numOrEmpty(data.episodes)}
                placeholder="24"
                className={inputCls}
              />
            </Field>
            <Field label="Minutes per episode">
              <input
                name="episodeMinutes"
                type="number"
                min={0}
                defaultValue={numOrEmpty(data.episodeMinutes)}
                placeholder="50"
                className={inputCls}
              />
            </Field>
          </div>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Format">
            <input name="format" defaultValue={data.format} placeholder="50 ep × 1m 15s" className={inputCls} />
          </Field>
          <Field label="Studio">
            <input name="studio" defaultValue={data.studio} list="studio-list" placeholder="Armenfilm, Sharm Holding…" className={inputCls} />
            <datalist id="studio-list">
              {studios.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </Field>
        </div>
      </section>

      {/* ── Translations ── */}
      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
            Translations (hy / ru / en)
          </h2>
          <button
            type="button"
            onClick={handleTranslate}
            disabled={translating}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-primary disabled:opacity-60"
          >
            {translating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Languages className="h-3.5 w-3.5" />}
            {translating ? t("translate.working") : t("btn.translate")}
          </button>
        </div>
        {translateError && (
          <p className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs text-primary">
            {t("translate.error")}: {t(`translate.${translateError}`)}
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Title (HY)">
            <input ref={titleRefs.hy} name="titleHy" defaultValue={data.titleHy} placeholder="Վերնագիր հայերեն" className={inputCls} />
          </Field>
          <Field label="Title (RU)">
            <input ref={titleRefs.ru} name="titleRu" defaultValue={data.titleRu} placeholder="Название по-русски" className={inputCls} />
          </Field>
          <Field label="Title (EN)">
            <input ref={titleRefs.en} name="titleEn" defaultValue={data.titleEn} placeholder="Title in English" className={inputCls} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Synopsis (HY)">
            <textarea
              ref={synopsisRefs.hy}
              name="synopsisHy"
              defaultValue={data.synopsisHy}
              rows={3}
              placeholder="Համառոտագիր հայերեն"
              className={`${inputCls} resize-none`}
            />
          </Field>
          <Field label="Synopsis (RU)">
            <textarea
              ref={synopsisRefs.ru}
              name="synopsisRu"
              defaultValue={data.synopsisRu}
              rows={3}
              placeholder="Краткое описание по-русски"
              className={`${inputCls} resize-none`}
            />
          </Field>
          <Field label="Synopsis (EN)">
            <textarea
              ref={synopsisRefs.en}
              name="synopsisEn"
              defaultValue={data.synopsisEn}
              rows={3}
              placeholder="Synopsis in English"
              className={`${inputCls} resize-none`}
            />
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
            <MultiSelect
              options={[]}
              value={countries}
              onChange={setCountries}
              name="countries"
              allowCustom
              placeholder="US, UK, …"
            />
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
            <MultiSelect
              options={[]}
              value={platforms}
              onChange={setPlatforms}
              name="platforms"
              allowCustom
              placeholder="YouTube, Kinodaran, TV"
            />
          </Field>
          <Field label="Placement type">
            <select name="placementType" defaultValue={data.placementType} className={inputCls}>
              <option value="">—</option>
              {PLACEMENT_TYPE_VALUES.map((pt) => (
                <option key={pt} value={pt}>
                  {pt}
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
              placeholder="500000"
              className={inputCls}
            />
          </Field>
          <Field label="Price max (AMD)">
            <input
              name="priceMaxAmd"
              type="number"
              min={0}
              defaultValue={numOrEmpty(data.priceMaxAmd)}
              placeholder="2000000"
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
            <select name="ageRating" defaultValue={data.ageRating} className={inputCls}>
              {AGE_RATING_VALUES.map((r) => (
                <option key={r} value={r}>
                  {r || "—"}
                </option>
              ))}
            </select>
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
              placeholder="3000"
              className={inputCls}
            />
          </Field>
          <Field label="CPM max (AMD)">
            <input
              name="cpmMaxAmd"
              type="number"
              min={0}
              defaultValue={numOrEmpty(data.cpmMaxAmd)}
              placeholder="8000"
              className={inputCls}
            />
          </Field>
          <Field label="Budget min (AMD)">
            <input
              name="budgetMinAmd"
              type="number"
              min={0}
              defaultValue={numOrEmpty(data.budgetMinAmd)}
              placeholder="5000000"
              className={inputCls}
            />
          </Field>
          <Field label="Budget max (AMD)">
            <input
              name="budgetMaxAmd"
              type="number"
              min={0}
              defaultValue={numOrEmpty(data.budgetMaxAmd)}
              placeholder="20000000"
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
        <Field label="Cinemas / exhibition venues">
          <MultiSelect
            options={[]}
            value={cinemas}
            onChange={setCinemas}
            name="cinemas"
            allowCustom
            placeholder="Cinema Star, Moscow Cinema, Kino Park"
          />
        </Field>
      </section>

      {/* ── Cast & crew (inline, #20²) ── */}
      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">Cast &amp; crew</h2>
        <ActorsSection value={actors} onChange={setActors} />
      </section>

      {/* ── Sponsorship tiers (inline, #20²) ── */}
      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">Sponsorship tiers</h2>
        <TiersSection value={tiers} onChange={setTiers} />
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
            <input name="sortOrder" type="number" defaultValue={data.sortOrder} placeholder="0" className={inputCls} />
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
          disabled={pending || navigating}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-70"
        >
          {(pending || navigating) && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </button>
        <Link href="/admin/projects" className="text-sm text-muted-foreground hover:text-foreground">
          Cancel
        </Link>
      </div>
    </form>
  );
}
