"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Languages, Loader2, RotateCcw, Sparkles, X } from "lucide-react";
import {
  AGE_RATING_VALUES,
  FORMAT_CATEGORY_VALUES,
  KIND_VALUES,
  LANGUAGE_VALUES,
  PLACEMENT_TYPE_VALUES,
  parseCsvInput,
} from "./form-shared";
import { ImageUploader, type ImageUploaderHandle } from "./image-uploader";
import { ActorsSection, type ActorRow } from "./actors-editor";
import type { PersonSuggestion } from "@/lib/data/actors";
import { TiersSection, type TierRow } from "./tiers-editor";
import { MultiSelect } from "@/components/ui/multi-select";
import { MediaField } from "@/components/media-field";
import { PosterGenerator, type PosterGenerateInput, type PosterGenerateResult } from "@/components/poster-generator";
import { GENRES } from "@/lib/genres";
import { type ProjectFormState, type ProjectFormValues } from "./actions";
import { translateProjectAction, type TranslateProjectState } from "./translate-action";
import { generatePosterAction } from "./poster-action";
import { makeUI, type Locale } from "@/lib/i18n";

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
  // videoFile mirrors through MediaField's own hidden input + React state, so
  // it restores via a keyed remount (like poster/gallery), not a DOM replay.
  "videoFile",
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
  formatCategory: "",
  language: "",
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
  taglineHy: "",
  taglineRu: "",
  taglineEn: "",
  subgenre: "",
  references: "",
  cinemas: "",
  videoEmbedUrl: "",
  videoFile: "",
};

// Labels come from t("projectForm.status.*") at render time (admin's t is
// pinned to "en", matching the strings this list used to hardcode).
const STATUS_OPTIONS = ["PRE_PRODUCTION", "FILMING", "POST_PRODUCTION", "RELEASED"] as const;

const GENDER_OPTIONS = ["All", "Male", "Female"] as const;

// #11 About block: the three locale tabs.
const ABOUT_LANGS = ["hy", "ru", "en"] as const;
// Display names for the tabs (language endonyms — locale-independent).
const ABOUT_LANG_NAMES: Record<TranslateLang, string> = { hy: "Հայերեն", ru: "Русский", en: "English" };
// Short description (tagline) hard cap + live "N left" counter, per the ref UI.
const TAGLINE_MAX = 140;

const inputCls =
  "w-full rounded-xl border border-border bg-card px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary";
const labelCls = "mb-1 block text-xs font-medium text-foreground";

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
  knownPeople = [],
  projectId,
  ownerHasAvatar = false,
  mode = "admin",
  locale = "en",
  translateAction = translateProjectAction,
  posterAction,
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
  /** People previously entered as cast/crew on any project (#11) — powers
   *  the Cast & Crew name autocomplete/autofill. */
  knownPeople?: PersonSuggestion[];
  /** Existing project id (edit mode only) — forwarded to generatePosterAction
   *  so the logo overlay can pull project.owner.avatar (#26). Unset on
   *  create: no owner yet, so the action falls back to the current staff
   *  user's own avatar. */
  projectId?: number;
  /** Whether the poster's future owner (project.owner on edit, the current
   *  staff user on create) has an avatar set — gates the "logo" checkbox in
   *  the poster generator panel. */
  ownerHasAvatar?: boolean;
  /** "creator" reuses this whole component for the Creator self-serve
   *  submission form (/account/projects/new) instead of a second, separately
   *  maintained form. It only changes what's NOT trusted to that side: the
   *  Visibility (isActive) section is hidden — moderationStatus/isActive are
   *  always forced server-side in that action, never form-controlled. Every
   *  other field/section renders identically. Defaults to "admin". */
  mode?: "admin" | "creator";
  /** UI locale for mode="creator" only — admin chrome always renders in "en"
   *  regardless of this prop (see the `t` assignment below). Defaults to
   *  "en" so an admin-mode caller that never sets it behaves exactly as
   *  before. */
  locale?: Locale;
  /** Backing action for the "Translate" button. Defaults to the staff-gated
   *  admin translateProjectAction; the creator form passes its own
   *  member-gated twin (see account/projects/translate-action.ts) so the
   *  button works without hitting the staff-only gate. */
  translateAction?: (fd: FormData) => Promise<TranslateProjectState>;
  /** Backing action for the "Generate poster" panel. Defaults to the admin
   *  generatePosterAction (wrapped below to forward projectId); the creator
   *  form passes its own member-gated twin (see account/projects/poster-action.ts). */
  posterAction?: (input: PosterGenerateInput) => Promise<PosterGenerateResult>;
}) {
  // Admin panel chrome stays English-only (#21/#15) — mode="creator" is the
  // only side that follows the caller's locale; admin ignores it entirely so
  // this component renders byte-identical to before for staff.
  const t = makeUI(mode === "creator" ? locale : "en");
  // Creator forms upload to the member's own namespace and the picker shows
  // only their files; admin forms use the shared staff library.
  const uploaderScope = mode === "creator" ? "member" : "staff";

  const [state, formAction, pending] = useActionState<ProjectFormState, FormData>(action, {});

  // On a failed submit (validation error), the server echoes back exactly
  // what the user typed in state.values — so re-rendering the form never
  // wipes the fields. Edit mode preboots from `initial`, create mode from
  // `EMPTY`; a returned `state.values` always wins once present.
  const data: ProjectFormInitial = state.values ?? initial ?? EMPTY;
  const isEdit = !!initial;

  // The action returns { ok, redirect } instead of calling redirect() itself
  // (see actions.ts). CREATE navigates to the redirect once the save succeeds
  // (the new project needs to land somewhere); EDIT stays on the form and flashes
  // a green "Saved" so the user keeps their place (user request 2026-07-24).
  const navigating = !!(state.ok && state.redirect && !isEdit);
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!state.ok) return;
    if (!isEdit && state.redirect) {
      // Create: a successful save supersedes any local draft, then navigate.
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      window.location.assign(state.redirect);
      return;
    }
    // Edit: stay put, clear the dirty flag, flash "Saved".
    setIsDirty(false);
    setSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 3000);
  }, [state.ok, state.redirect, isEdit]);

  // ── Sticky Save bar dirty flag ── independent of the create-only draft
  // autosave above: works in both admin/creator and create/edit modes. Any
  // keystroke/select/checkbox toggle on a plain field fires the form's
  // native "input" event (already wired for draft autosave), and controlled
  // widgets (MultiSelect, kind, actors, tiers) flip it via the effect below.
  const [isDirty, setIsDirty] = useState(false);
  function handleFormInput() {
    setIsDirty(true);
    scheduleSaveDraft();
  }

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

  // ── Translate (#21): hy/ru/en refs are plain uncontrolled fields
  // (defaultValue), so the "Translate" button fills the other two languages
  // by writing straight into the DOM via refs — no controlled state needed,
  // and the results stay freely editable afterwards, same as any hand-typed
  // value, since the native <form> reads .value at submit.
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
  // #11: Short description (tagline) is now a <textarea> (was an <input>) — the
  // refs must match so the Translate button can still write into it via .value.
  const taglineRefs: Record<TranslateLang, React.RefObject<HTMLTextAreaElement | null>> = {
    hy: useRef<HTMLTextAreaElement>(null),
    ru: useRef<HTMLTextAreaElement>(null),
    en: useRef<HTMLTextAreaElement>(null),
  };

  // ── Generate poster (#26) ── posterUploaderRef lets the panel push its
  // result straight into the (otherwise self-contained) poster ImageUploader
  // without lifting that component's state up. getDefaultPromptForPoster
  // reads the *current* title/genres/synopsis at the moment the panel first
  // opens (not a value frozen at mount) since title/synopsis are uncontrolled refs.
  const posterUploaderRef = useRef<ImageUploaderHandle>(null);
  // Default wraps admin's generatePosterAction with this form's own
  // projectId prop (only meaningful on edit) — computed here rather than as
  // a destructuring default so it can close over `projectId`.
  const resolvedPosterAction =
    posterAction ?? ((input: PosterGenerateInput) => generatePosterAction({ ...input, projectId }));
  function getDefaultPromptForPoster(): string {
    const title = titleRefs.ru.current?.value || titleRefs.hy.current?.value || titleRefs.en.current?.value || "";
    const synopsis =
      synopsisRefs.ru.current?.value || synopsisRefs.hy.current?.value || synopsisRefs.en.current?.value || "";
    return [title, genres.join(", "), synopsis].filter(Boolean).join(". ");
  }
  const [translating, startTranslate] = useTransition();
  const [translateError, setTranslateError] = useState<NonNullable<TranslateProjectState["errorCode"]> | null>(null);

  // ── About block (#11) ── which locale tab is showing. All three panels stay
  // MOUNTED (inactive ones just get `hidden`) so the uncontrolled refs, hidden
  // mirrors and the Translate button keep working exactly as before.
  const [aboutTab, setAboutTab] = useState<TranslateLang>("hy");
  // Live "characters left" counter for the Short description textareas. Kept as
  // state (updated onInput + after a Translate write) so the count stays live
  // while the fields themselves remain uncontrolled (ref-driven).
  const [taglineLen, setTaglineLen] = useState<Record<TranslateLang, number>>(() => ({
    hy: (data.taglineHy || data.tagline || "").length,
    ru: data.taglineRu.length,
    en: data.taglineEn.length,
  }));


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
  // videoFile's MediaField seeds from `initial` at mount too — remount it with
  // the restored path on draft restore (same pattern as poster/gallery).
  const [videoFileInitial, setVideoFileInitial] = useState(data.videoFile);
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
  // Skip the very first run so merely opening the form doesn't write a draft
  // or flip the sticky-bar dirty dot.
  useEffect(() => {
    if (skipFirstDraftEffect.current) {
      skipFirstDraftEffect.current = false;
      return;
    }
    setIsDirty(true);
    if (isEdit) return;
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
    setVideoFileInitial(obj.videoFile ?? "");
    // Short-description counters ← restored lengths.
    setTaglineLen({
      hy: (obj.taglineHy ?? "").length,
      ru: (obj.taglineRu ?? "").length,
      en: (obj.taglineEn ?? "").length,
    });
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
    // per spec default).
    const langPriority: TranslateLang[] = ["ru", "hy", "en"];
    const hit = langPriority.find((l) => (titleRefs[l].current?.value || "").trim());
    if (!hit) {
      setTranslateError("emptyFields");
      return;
    }
    const sourceLang = hit;
    const sourceTitle = titleRefs[hit].current?.value || "";
    const sourceSynopsis = synopsisRefs[hit].current?.value || "";
    const sourceTagline = taglineRefs[hit].current?.value || "";

    // Bug fix (#5): only propagate fields the user actually filled in the
    // source locale. A field left BLANK in the source must NOT overwrite the
    // other locales' existing values with an empty translation — the model
    // returns "" for an empty input, so without this guard clearing one
    // locale's synopsis and hitting Translate wiped every locale's synopsis.
    const hasTitle = sourceTitle.trim().length > 0;
    const hasSynopsis = sourceSynopsis.trim().length > 0;
    const hasTagline = sourceTagline.trim().length > 0;

    const fd = new FormData();
    fd.set("sourceLang", sourceLang);
    fd.set("title", sourceTitle);
    fd.set("synopsis", sourceSynopsis);
    fd.set("tagline", sourceTagline);

    startTranslate(async () => {
      const res = await translateAction(fd);
      if (res.errorCode) {
        setTranslateError(res.errorCode);
        return;
      }
      for (const [lang, value] of Object.entries(res.values || {})) {
        const l = lang as TranslateLang;
        // Per-field guard: leave a target untouched when its source was blank.
        if (hasTitle && titleRefs[l]?.current) titleRefs[l].current!.value = value.title;
        if (hasSynopsis && synopsisRefs[l]?.current) synopsisRefs[l].current!.value = value.synopsis;
        if (hasTagline && taglineRefs[l]?.current) {
          taglineRefs[l].current!.value = value.tagline;
          setTaglineLen((prev) => ({ ...prev, [l]: value.tagline.length }));
        }
      }
      scheduleSaveDraft();
    });
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      onInput={handleFormInput}
      className="max-w-[1400px] space-y-4"
    >
      {/* Hidden mirrors of the inline cast/crew + tier editors, submitted with
          the main form and parsed by create/updateProject (#20²). */}
      <input type="hidden" name="actorsRows" value={JSON.stringify(actors)} />
      <input type="hidden" name="tiersRows" value={JSON.stringify(tiers)} />

      {/* ── Sticky Save bar ── pinned so Submit/dirty-state is reachable
          without scrolling to the bottom of a long form. Duplicates the
          bottom Submit button below (same <form>, both are plain
          type="submit"); the bottom one stays for the natural end-of-form
          flow. */}
      <div className="sticky top-14 z-20 -mx-4 flex items-center justify-between gap-3 border-b border-border bg-card/95 px-4 py-2.5 backdrop-blur sm:-mx-6 sm:px-6 md:-mx-10 md:top-0 md:px-10">
        <div className="flex min-w-0 items-center gap-3">
          {isDirty && !navigating ? (
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-danger">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-danger" aria-hidden="true" />
              {t("projectForm.unsavedChanges")}
            </span>
          ) : saved ? (
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-success">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" aria-hidden="true" />
              {t("projectForm.saved")}
            </span>
          ) : null}
        </div>
        {/* Actions grouped on the right: Cancel (outline) beside Save. Back nav
            lives in the top "Back to projects" link, so Cancel here is a button,
            not a left-aligned back-link (user request 2026-07-24). */}
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={mode === "creator" ? "/account/projects" : "/admin/projects"}
            className="inline-flex items-center rounded-lg border border-border px-5 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            {t("projectForm.cancel")}
          </Link>
          <button
            type="submit"
            disabled={pending || navigating}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-70"
          >
            {(pending || navigating) && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitLabel}
          </button>
        </div>
      </div>

      {draftFound && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm">
          <span className="text-foreground">{t("projectForm.draftFound")}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={restoreDraft}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
            >
              <RotateCcw className="h-3.5 w-3.5" /> {t("projectForm.restoreDraft")}
            </button>
            <button
              type="button"
              onClick={discardDraft}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary/40"
            >
              <X className="h-3.5 w-3.5" /> {t("projectForm.discardDraft")}
            </button>
          </div>
        </div>
      )}

      {/* ── Two-column layout ── ONE <form> wraps both columns; pure CSS grid.
          Main column = content (About, media, cast & crew, tiers); the narrow
          right sidebar = meta (classification, status, placement, audience,
          visibility). Below lg the sidebar stacks under the main column.
          (The section rail was removed — redundant per user, 2026-07-24.) */}
      <div className="items-start gap-4 space-y-4 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:space-y-0">
        {/* ══ Main column ══ */}
        <div className="min-w-0 space-y-4">
          {/* ── About (#11) ── per-locale Title / Description / Short description,
              split into hy/ru/en TABS. All three panels stay MOUNTED (inactive ones
              are just `hidden`) so the uncontrolled refs + hidden mirrors + the
              Translate button keep working exactly as before. */}
          <section id="sec-about" className="scroll-mt-24 space-y-3 rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
                {t("projectForm.section.about")}
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

            {/* Tab switcher */}
            <div className="flex gap-1 rounded-xl border border-border bg-background p-1">
              {ABOUT_LANGS.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setAboutTab(l)}
                  className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    aboutTab === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {ABOUT_LANG_NAMES[l]}
                </button>
              ))}
            </div>

            {ABOUT_LANGS.map((l) => {
              const nameSuffix = l === "hy" ? "Hy" : l === "ru" ? "Ru" : "En";
              const titleValue = l === "hy" ? data.titleHy : l === "ru" ? data.titleRu : data.titleEn;
              const synopsisValue = l === "hy" ? data.synopsisHy : l === "ru" ? data.synopsisRu : data.synopsisEn;
              const taglineValue =
                l === "hy" ? data.taglineHy || data.tagline : l === "ru" ? data.taglineRu : data.taglineEn;
              return (
                <div key={l} className={aboutTab === l ? "space-y-4" : "hidden"}>
                  <Field label={t("projectForm.about.title")}>
                    {/* Not `required`: a hidden tab's field can't be focused for
                        native validation (would silently block submit). Title is
                        validated server-side instead (needs ≥1 non-empty locale). */}
                    <input
                      ref={titleRefs[l]}
                      name={`title${nameSuffix}`}
                      defaultValue={titleValue}
                      placeholder={t("projectForm.about.title")}
                      className={inputCls}
                    />
                  </Field>
                  <Field label={t("projectForm.about.description")}>
                    <textarea
                      ref={synopsisRefs[l]}
                      name={`synopsis${nameSuffix}`}
                      defaultValue={synopsisValue}
                      rows={5}
                      placeholder={t("projectForm.about.descriptionPlaceholder")}
                      className={`${inputCls} resize-y`}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">{t("projectForm.about.richHint")}</p>
                  </Field>
                  <Field label={t("projectForm.about.shortDescription")}>
                    <textarea
                      ref={taglineRefs[l]}
                      name={`tagline${nameSuffix}`}
                      defaultValue={taglineValue}
                      rows={2}
                      maxLength={TAGLINE_MAX}
                      onInput={(e) => setTaglineLen((prev) => ({ ...prev, [l]: e.currentTarget.value.length }))}
                      placeholder={t("projectForm.about.shortDescriptionPlaceholder")}
                      className={`${inputCls} resize-none`}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {TAGLINE_MAX - (taglineLen[l] ?? 0)} {t("projectForm.about.charsLeft")}
                    </p>
                  </Field>
                </div>
              );
            })}
          </section>

          {/* ── Press-kit: poster, gallery & video ── the project's media all
              lives here in the main column. Tagline / logline moved into the
              About block above (per-locale hy/ru/en); cinemas moved to the
              Placement card in the meta sidebar. */}
          <section id="sec-media" className="scroll-mt-24 space-y-3 rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
              {t("projectForm.section.pressKit")}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t("projectForm.field.poster")}>
                {/* "Upload poster" and the "Generate poster" trigger sit on ONE row
                    (trailing slot) so the generate action stays next to upload even
                    after a poster is uploaded (preview thumbs render below). The
                    panel itself opens full-width below the grid. */}
                <ImageUploader
                  key={`poster-${restoreNonce}`}
                  ref={posterUploaderRef}
                  name="poster"
                  dir="projects"
                  scope={uploaderScope}
                  browseLabel={t("btn.browse")}
                  initial={posterInitial}
                  label={t("projectForm.uploadPoster")}
                  removeLabel={t("ui.remove")}
                  trailing={
                    <>
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">{t("projectForm.or")}</span>
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
              action={resolvedPosterAction}
              getDefaultPrompt={getDefaultPromptForPoster}
              hasOwnerAvatar={ownerHasAvatar}
              onUse={(path) => posterUploaderRef.current?.addPath(path)}
              t={t}
              scope={uploaderScope}
              uploadDir="projects"
            />
            <Field label={t("projectForm.field.gallery")}>
              <ImageUploader
                key={`gallery-${restoreNonce}`}
                name="gallery"
                dir="projects"
                multiple
                scope={uploaderScope}
                browseLabel={t("btn.browse")}
                initial={galleryInitial}
                label={t("projectForm.uploadGalleryImages")}
                removeLabel={t("ui.remove")}
              />
            </Field>
            {/* ── Video (#10) ── a YouTube/Vimeo link OR an uploaded MP4; the embed
                link wins on the report page when both are set. */}
            <Field label={t("projectForm.field.videoEmbed")}>
              <input
                name="videoEmbedUrl"
                defaultValue={data.videoEmbedUrl}
                placeholder={t("projectForm.videoEmbedPlaceholder")}
                className={inputCls}
              />
            </Field>
            <Field label={t("projectForm.field.videoFile")}>
              <MediaField
                key={`video-${restoreNonce}`}
                name="videoFile"
                initial={videoFileInitial}
                label={t("btn.browse")}
                uploadDir="videos"
                accept="video"
                scope={uploaderScope}
              />
            </Field>
            <Field label={t("projectForm.field.references")}>
              <input
                name="references"
                defaultValue={data.references}
                placeholder={t("projectForm.referencesPlaceholder")}
                className={inputCls}
              />
            </Field>
          </section>

          {/* ── Cast & crew (inline, #20²) ── */}
          <section id="sec-cast" className="scroll-mt-24 space-y-3 rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">{t("projectForm.section.castCrew")}</h2>
            <ActorsSection value={actors} onChange={setActors} knownPeople={knownPeople} t={t} scope={uploaderScope} />
          </section>

          {/* ── Sponsorship tiers (inline, #20²) ── */}
          <section id="sec-tiers" className="scroll-mt-24 space-y-3 rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">{t("projectForm.section.sponsorshipTiers")}</h2>
            <TiersSection value={tiers} onChange={setTiers} t={t} />
          </section>
        </div>

        {/* ══ Meta sidebar ══ narrow column of "settings-ish" fields; fields
            stack single-column (320px wide on lg+). Deliberately NOT sticky:
            it is taller than a viewport, and clipping it into its own scroll
            area would cut off the MultiSelect dropdowns inside. */}
        <div className="min-w-0 space-y-4">
          {/* ── General ── classification meta (code, kind, genre, format…). */}
          <section id="sec-general" className="scroll-mt-24 space-y-3 rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">{t("projectForm.section.general")}</h2>
            {/* Project code is auto-generated and intentionally never shown (#2 —
                hide code EVERYWHERE incl. admin). Edit mode keeps it as a hidden
                input so the update round-trips it; new projects get theirs
                server-side. */}
            {isEdit && <input type="hidden" name="code" defaultValue={data.code} />}
            <Field label={t("projectForm.field.kind")}>
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
                    {k === "FILM" ? t("projectForm.kindFilm") : t("projectForm.kindSerial")}
                  </label>
                ))}
              </div>
            </Field>
            <Field label={t("projectForm.field.genre")}>
              <MultiSelect
                options={GENRES}
                value={genres}
                onChange={setGenres}
                name="genres"
                placeholder={t("projectForm.genresPlaceholder")}
                addLabel={t("ui.addOption")}
                removeLabel={t("ui.remove")}
              />
            </Field>
            <Field label={t("projectForm.field.formatCategory")}>
              <select name="formatCategory" defaultValue={data.formatCategory} className={inputCls}>
                <option value="">—</option>
                {FORMAT_CATEGORY_VALUES.map((v) => (
                  <option key={v} value={v}>
                    {t(`formatCategory.${v}`)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("projectForm.field.language")}>
              <select name="language" defaultValue={data.language} className={inputCls}>
                <option value="">—</option>
                {LANGUAGE_VALUES.map((v) => (
                  <option key={v} value={v}>
                    {t(`language.${v}`)}
                  </option>
                ))}
              </select>
            </Field>
            {kind === "SERIAL" ? (
              <div className="grid grid-cols-2 gap-3">
                <Field label={t("projectForm.field.episodes")}>
                  <input
                    name="episodes"
                    type="number"
                    min={0}
                    defaultValue={numOrEmpty(data.episodes)}
                    placeholder="24"
                    className={inputCls}
                  />
                </Field>
                <Field label={t("projectForm.field.episodeMinutes")}>
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
            <Field label={t("projectForm.field.studio")}>
              <input name="studio" defaultValue={data.studio} list="studio-list" placeholder={t("projectForm.studioPlaceholder")} className={inputCls} />
              <datalist id="studio-list">
                {studios.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </Field>
          </section>

          {/* ── Status & release ── */}
          <section id="sec-status" className="scroll-mt-24 space-y-3 rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">{t("projectForm.section.statusRelease")}</h2>
            <Field label={t("projectForm.field.status")}>
              <select name="status" defaultValue={data.status} className={inputCls}>
                {STATUS_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {t(`projectForm.status.${o}`)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("projectForm.field.countries")}>
              <MultiSelect
                options={[]}
                value={countries}
                onChange={setCountries}
                name="countries"
                allowCustom
                placeholder={t("projectForm.countriesPlaceholder")}
                addLabel={t("ui.addOption")}
                removeLabel={t("ui.remove")}
              />
            </Field>
          </section>

          {/* ── Placement ── */}
          <section id="sec-placement" className="scroll-mt-24 space-y-3 rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">{t("projectForm.section.placement")}</h2>
            <Field label={t("projectForm.field.applicationDeadline")}>
              <input
                name="applicationDeadline"
                type="date"
                defaultValue={data.applicationDeadline}
                className={inputCls}
              />
            </Field>
            <Field label={t("projectForm.field.releaseDate")}>
              <input name="releaseDate" type="date" defaultValue={data.releaseDate} className={inputCls} />
            </Field>
            <Field label={t("projectForm.field.platforms")}>
              <MultiSelect
                options={[]}
                value={platforms}
                onChange={setPlatforms}
                name="platforms"
                allowCustom
                placeholder={t("projectForm.platformsPlaceholder")}
                addLabel={t("ui.addOption")}
                removeLabel={t("ui.remove")}
              />
            </Field>
            <Field label={t("projectForm.field.placementType")}>
              <select name="placementType" defaultValue={data.placementType} className={inputCls}>
                <option value="">—</option>
                {PLACEMENT_TYPE_VALUES.map((pt) => (
                  <option key={pt} value={pt}>
                    {t(`placement.${pt}`)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("projectForm.field.cinemas")}>
              <MultiSelect
                options={[]}
                value={cinemas}
                onChange={setCinemas}
                name="cinemas"
                allowCustom
                placeholder={t("projectForm.cinemasPlaceholder")}
                addLabel={t("ui.addOption")}
                removeLabel={t("ui.remove")}
              />
            </Field>
            <Field label={t("projectForm.field.priceNote")}>
              <input
                name="priceNote"
                defaultValue={data.priceNote}
                placeholder={t("projectForm.priceNotePlaceholder")}
                className={inputCls}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("projectForm.field.priceMin")}>
                <input
                  name="priceMinAmd"
                  type="number"
                  min={0}
                  defaultValue={numOrEmpty(data.priceMinAmd)}
                  placeholder="500000"
                  className={inputCls}
                />
              </Field>
              <Field label={t("projectForm.field.priceMax")}>
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
            <p className="text-xs text-muted-foreground">{t("projectForm.priceHint")}</p>
          </section>

          {/* ── Audience & value ── */}
          <section id="sec-audience" className="scroll-mt-24 space-y-3 rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">{t("projectForm.section.audienceValue")}</h2>
            <Field label={t("projectForm.field.audienceGender")}>
              <select name="audienceGender" defaultValue={data.audienceGender} className={inputCls}>
                {GENDER_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {t(`gender.${g}`)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("projectForm.field.audienceAge")}>
              <input name="audienceAge" defaultValue={data.audienceAge} placeholder={t("projectForm.audienceAgePlaceholder")} className={inputCls} />
            </Field>
            <Field label={t("projectForm.field.ageRating")}>
              <select name="ageRating" defaultValue={data.ageRating} className={inputCls}>
                {AGE_RATING_VALUES.map((r) => (
                  <option key={r} value={r}>
                    {r || "—"}
                  </option>
                ))}
              </select>
            </Field>
          </section>

          {/* ── Visibility ── admin only: a Creator never controls publication —
              moderationStatus/isActive are always forced server-side for them
              (see account/projects/actions.ts). */}
          {mode !== "creator" && (
            <section id="sec-visibility" className="scroll-mt-24 space-y-3 rounded-xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">{t("projectForm.section.visibility")}</h2>
              <label className="inline-flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" name="isActive" defaultChecked={data.isActive} className="h-4 w-4 accent-primary" />
                {t("projectForm.activeCheckbox")}
              </label>
            </section>
          )}
        </div>
      </div>

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
        <Link
          href={mode === "creator" ? "/account/projects" : "/admin/projects"}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {t("projectForm.cancel")}
        </Link>
      </div>
    </form>
  );
}
