"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Languages, Loader2, RotateCcw, Sparkles, X } from "lucide-react";
import {
  AGE_RATING_VALUES,
  KIND_VALUES,
  parseCsvInput,
  parseReferencesInput,
  parseMilestonesInput,
  type ReferenceRow,
  type MilestoneRow,
} from "./form-shared";
import { deleteStreamingSource } from "@/lib/actions/streaming-sources";
import { deleteCountry } from "@/lib/actions/countries";
import { deleteStudio } from "@/lib/actions/studios";
import { ImageUploader, type ImageUploaderHandle } from "./image-uploader";
import { ActorsSection, type ActorRow } from "./actors-editor";
import type { PersonSuggestion } from "@/lib/data/actors";
import { TiersSection, type TierRow, type TierTemplate } from "./tiers-editor";
import { PlacementsSection, type PlacementRow } from "./placements-editor";
import { ReferencesSection } from "./references-editor";
import { MilestonesSection } from "./milestones-editor";
import { MultiSelect } from "@/components/ui/multi-select";
import { MediaField } from "@/components/media-field";
import { PosterGenerator, type PosterGenerateInput, type PosterGenerateResult } from "@/components/poster-generator";
import { GENRES } from "@/lib/genres";
import { type ProjectFormState, type ProjectFormValues } from "./actions";
import { translateProjectAction, type TranslateProjectState } from "./translate-action";
import { generatePosterAction } from "./poster-action";
import { makeUI, type Locale } from "@/lib/i18n";
import { ConfirmDialog } from "@/components/confirm-dialog";

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
  "language",
  "kind",
  "actorsRows",
  "tiersRows",
  "placementsRows",
  "references",
  "milestonesRows",
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
  formatCategory: "",
  language: "",
  studio: "",
  kind: "FILM",
  episodes: null,
  episodeMinutes: null,
  durationMinutes: null,
  countries: "",
  ageRating: "",
  productionBudgetAmd: null,
  isActive: true,
  applicationDeadline: "",
  releaseDate: "",
  platforms: "",
  tagline: "",
  taglineHy: "",
  taglineRu: "",
  taglineEn: "",
  references: "",
  cinemas: "",
  videoEmbedUrl: "",
  videoFile: "",
};

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
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  /** Optional helper text, rendered under the field — for fields whose
   *  purpose/format isn't obvious from the label alone. */
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="block">
      <span className={labelCls}>{label}</span>
      {children}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function ProjectForm({
  action,
  initial,
  initialActors = [],
  initialTiers = [],
  initialPlacements = [],
  initialMilestones = [],
  submitLabel,
  studios = [],
  tierTemplates = [],
  streamingSources = [],
  countryOptions: countries0 = [],
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
  /** Product placement rows (owner correction 2026-07-28) — same story as
   *  initialTiers, a separate offer from the sponsorship tiers above. */
  initialPlacements?: PlacementRow[];
  /** Production-timeline milestone rows (Ф4/#27) — admin-only section; same
   *  hidden-JSON-mirror pattern. Empty on create. */
  initialMilestones?: MilestoneRow[];
  submitLabel: string;
  /** Global studio dictionary (2026-07-27) — the "Studio name" picker's option
   *  list. Was a plain <datalist> of names already typed elsewhere; it is a
   *  real dictionary now, with the same contract as streamingSources/
   *  countryOptions (a typed-in studio persists for future projects, staff can
   *  delete one from the pool). */
  studios?: string[];
  /** Placements already offered on other projects, ready to be added in one
   *  click (see lib/data/tier-templates.ts). Empty is fine — the menu then
   *  degrades to the plain "add a blank row" button. */
  tierTemplates?: TierTemplate[];
  /** Global Streaming Source dictionary (Ф2/#25) — powers the Streaming
   *  Source MultiSelect's option list; custom additions persist here for
   *  future projects (see addStreamingSources in actions.ts). */
  streamingSources?: string[];
  /** Global country dictionary (2026-07-27) — the "Content Original Countries"
   *  picker's option list. Same contract as streamingSources: a value typed in
   *  is added to the dictionary on save, and staff can delete one from the
   *  dropdown. */
  countryOptions?: string[];
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

  // The error banner sits at the very bottom of a form that runs ~11 000px
  // tall, while both Save buttons live in the sticky header — so a rejected
  // save (e.g. the publish-time requirements added 2026-07-26) looked exactly
  // like a dead button: nothing visibly happened. Scroll the message into view
  // whenever one arrives.
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (state.error) errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [state.error]);

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
    // Edit: stay put, clear the dirty flag, flash "Saved". What's on screen is
    // now what's stored, so it becomes the new comparison baseline.
    baselineSnapshot.current = snapshotForm();
    setIsDirty(false);
    // "Save and leave": the click that was held now goes through.
    if (leaveAfterSave.current) {
      const href = leaveAfterSave.current;
      leaveAfterSave.current = null;
      window.location.assign(href);
      return;
    }
    setSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 3000);
    // Depends on `state` as a whole, NOT on state.ok/state.redirect: those two
    // read identically on a second successful save in the same tab, so the
    // effect never re-ran and everything below it silently stopped happening —
    // "Save and leave" saved but never navigated, and the dirty flag stayed
    // set. useActionState hands back a fresh object per dispatch, so the whole
    // state is the only dependency that actually changes per save. Same trap as
    // IA-15 (commit 364b8f9); it was fixed there on one <select> and left here.
  }, [state, isEdit]);

  // React 19 resets the <form> DOM once an action finishes. Plain fields keep
  // what the user typed (React restores them) and the hidden JSON mirrors are
  // fine, but a radio group whose only source of truth is `checked` snaps back
  // to the markup's page-load state — and if the component doesn't re-render
  // afterwards, nothing puts it right. That is why "Format: Series → Single,
  // Save" looked correct, and a SECOND Save without touching anything flipped
  // the dial back to Series: the first save re-rendered (state.ok false→true),
  // the second had nothing to change. The DB was right the whole time; only the
  // dial lied, which is worse — it invites you to "fix" a value that is already
  // correct.
  //
  // Remounting the radios after every dispatch re-applies `checked` from state,
  // whatever the reset did to the DOM.
  const [formEpoch, setFormEpoch] = useState(0);
  useEffect(() => {
    // Skip the initial mount — useActionState starts at {} and no submit has
    // happened yet.
    if (!state.ok && !state.error) return;
    setFormEpoch((n) => n + 1);
  }, [state]);

  // ── Sticky Save bar dirty flag ── independent of the create-only draft
  // autosave above: works in both admin/creator and create/edit modes. Any
  // keystroke/select/checkbox toggle on a plain field fires the form's
  // native "input" event (already wired for draft autosave), and controlled
  // widgets (MultiSelect, kind, actors, tiers) flip it via the effect below.
  const [isDirty, setIsDirty] = useState(false);

  // The flag used to be "anything fired an event → dirty", which lit up the
  // moment the form mounted: several controlled widgets settle into their
  // seeded value on the first render, and that counted as an edit even though
  // the user hadn't touched anything. It now compares the live form against a
  // snapshot taken once the form has settled, so "Unsaved changes" appears
  // only when something actually differs from what's stored.
  const baselineSnapshot = useRef<string | null>(null);

  /** Every string field of the form, serialized in DOM order. File inputs are
   *  skipped (same filter the draft autosave uses). */
  function snapshotForm(): string | null {
    const form = formRef.current;
    if (!form) return null;
    const values: Record<string, string> = {};
    for (const [k, v] of new FormData(form).entries()) {
      if (typeof v === "string") values[k] = v;
    }
    return JSON.stringify(values);
  }

  function recomputeDirty() {
    const current = snapshotForm();
    if (current === null || baselineSnapshot.current === null) return;
    setIsDirty(current !== baselineSnapshot.current);
  }

  function handleFormInput() {
    recomputeDirty();
    scheduleSaveDraft();
  }

  // ── Leaving with unsaved work ─────────────────────────────────────────
  // The sticky bar only *shows* the dirty state; clicking a nav link still
  // dropped everything typed without a word (user report 2026-07-26). A
  // pending in-app navigation is held here until the user decides.
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  // Set when they chose "save and leave": the post-save effect below picks it
  // up and completes the navigation once the action reports success.
  const leaveAfterSave = useRef<string | null>(null);

  useEffect(() => {
    if (!isDirty) return;

    // Reload / close tab / external URL — the browser's own generic prompt is
    // the only thing available here.
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }

    // In-app navigation (admin sidebar, "Back to projects", any <Link>) never
    // hits beforeunload, so intercept the click itself while it's still
    // cancellable and ask properly.
    function onDocumentClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      // Same-page anchors, downloads and new tabs aren't leaving the form.
      if (!href || href.startsWith("#") || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;
      e.preventDefault();
      e.stopPropagation();
      setPendingHref(url.pathname + url.search);
    }

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onDocumentClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onDocumentClick, true);
    };
  }, [isDirty]);

  // ── Controlled fields that don't fit a plain <input defaultValue> ──
  const [genres, setGenres] = useState<string[]>(() => data.genres);
  const [kind, setKind] = useState<ProjectFormInitial["kind"]>(() => data.kind);
  const [countries, setCountries] = useState<string[]>(() => parseCsvInput(data.countries));
  const [platforms, setPlatforms] = useState<string[]>(() => parseCsvInput(data.platforms));
  const [cinemas, setCinemas] = useState<string[]>(() => parseCsvInput(data.cinemas));
  const [languages, setLanguages] = useState<string[]>(() => parseCsvInput(data.language));
  // Global Streaming Source dictionary (Ф2/#25) — seeded from the server, then
  // kept in sync client-side as options are deleted via the dropdown's "×".
  // Now powers the merged "Available on" field (Platforms + Streaming source).
  const [streamOptions, setStreamOptions] = useState<string[]>(() => streamingSources);
  const [streamOptionPending, startStreamOptionTransition] = useTransition();
  // Which dictionary value is pending deletion — drives the styled confirm
  // dialog that replaced window.confirm() here. Deleting is global: every
  // project loses the option, so it warrants a real warning, not an OS box.
  const [deletingStreamOption, setDeletingStreamOption] = useState<string | null>(null);
  // Same three pieces of state for the country dictionary (2026-07-27) — the
  // options list, the pending delete, and the transition that persists it.
  const [countryOptions, setCountryOptions] = useState<string[]>(() => countries0);
  const [countryOptionPending, startCountryOptionTransition] = useTransition();
  const [deletingCountryOption, setDeletingCountryOption] = useState<string | null>(null);
  // Studio became the third dictionary of this shape (2026-07-27). It used to
  // be one free-text input, so co-productions had nowhere to go and the same
  // company arrived spelled several ways; the column now holds a comma list,
  // exactly like `countries`.
  const [studioValues, setStudioValues] = useState<string[]>(() => parseCsvInput(data.studio));
  const [studioOptions, setStudioOptions] = useState<string[]>(() => studios);
  const [studioOptionPending, startStudioOptionTransition] = useTransition();
  const [deletingStudioOption, setDeletingStudioOption] = useState<string | null>(null);
  // ── Cast/crew + sponsorship tiers, inline (#20²) ──
  const [actors, setActors] = useState<ActorRow[]>(() => initialActors);
  const [tiers, setTiers] = useState<TierRow[]>(() => initialTiers);
  // ── Product placements (owner correction 2026-07-28): same "ride along as a
  // hidden JSON input" pattern as tiers above, but a separate offer. ──
  const [placements, setPlacements] = useState<PlacementRow[]>(() => initialPlacements);
  // ── Reference Projects (Ф2): repeatable {name,url} rows, same "ride along
  // as a hidden JSON input" pattern as actors/tiers above. ──
  const [references, setReferences] = useState<ReferenceRow[]>(() => parseReferencesInput(data.references));
  // ── Production Timeline (Ф4/#27): admin-only repeatable milestones, seeded
  // from the server (create = empty). Same hidden-JSON-mirror pattern. ──
  const [milestones, setMilestones] = useState<MilestoneRow[]>(() => initialMilestones);
  // Poster generator open state is lifted so its panel can render full-width
  // below the grid while the trigger stays compact in the Poster field.
  const [posterOpen, setPosterOpen] = useState(false);
  // ── Video source tab (#35) ── a project has exactly ONE video source, so
  // only the active tab's field renders; the inactive one unmounts and drops
  // out of the submitted FormData, letting the server null that column.
  const [videoTab, setVideoTab] = useState<"embed" | "upload">(() => (data.videoFile ? "upload" : "embed"));

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
  // The first run is where the baseline is taken instead: by then every
  // controlled widget has mirrored its seeded value into a hidden input, so
  // the snapshot matches what's actually stored.
  useEffect(() => {
    if (skipFirstDraftEffect.current) {
      skipFirstDraftEffect.current = false;
      baselineSnapshot.current = snapshotForm();
      return;
    }
    recomputeDirty();
    if (isEdit) return;
    scheduleSaveDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genres, kind, countries, platforms, cinemas, languages, actors, tiers, references, milestones]);

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
    // A restored draft IS unsaved work — compare against the stored values,
    // not against what was just replayed onto the DOM.
    recomputeDirty();
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
    setLanguages(parseArr(obj.language));
    setActors(parseArr(obj.actorsRows) as unknown as ActorRow[]);
    setTiers(parseArr(obj.tiersRows) as unknown as TierRow[]);
    setPlacements(parseArr(obj.placementsRows) as unknown as PlacementRow[]);
    setReferences(parseArr(obj.references) as unknown as ReferenceRow[]);
    setMilestones(parseArr(obj.milestonesRows) as unknown as MilestoneRow[]);
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
      <input type="hidden" name="placementsRows" value={JSON.stringify(placements)} />
      {/* Reference Projects (Ф2): a repeatable {name,url} list, same "hidden
          JSON mirror" pattern as actorsRows/tiersRows above. */}
      <input type="hidden" name="references" value={JSON.stringify(references)} />
      {/* Production Timeline (Ф4/#27) — admin-only, so only mirrored in admin
          mode; the creator action never reads/writes milestones. */}
      {mode !== "creator" && (
        <input type="hidden" name="milestonesRows" value={JSON.stringify(milestones)} />
      )}

      {/* Admin redesign phase 1: formatCategory was dropped from the UI but the
          server action still reads it via formData.get() on every save — an
          absent field would silently blank out existing data on edit. Carried
          as a hidden input so a save round-trips whatever value the row
          already has instead of clearing it. It's still derived server-side
          (deriveFormatCategory, used by the public catalog Format filter)
          even though its own dropdown is gone. (Views/Budget/CPM/Audience/
          Price/Subgenre/Release label were dropped from the schema entirely
          in Ф2/#30 — no longer round-tripped here.) */}
      <input type="hidden" name="formatCategory" defaultValue={data.formatCategory} />

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

      {/* ── Two-column layout ── content column + a 320px meta sidebar,
          sections split: main column carries About → Design → Cast & crew →
          Placement(s) → Reference Projects; sidebar carries General →
          Production Info → Visibility. */}
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

          {/* ── Design (was "Press-kit"): poster, gallery & video ── the
              project's media all lives here. Tagline / logline is in the About
              block above (per-locale hy/ru/en); Comparable titles moved to its
              own Reference Projects section at the end of the form. */}
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
                  pickerLocale={locale}
                  browseLabel={t("btn.browse")}
                  dropTitle={t("media.dropTitlePoster")}
                  dropLabel={t("media.dropHereOne")}
                  errTooLargeLabel={t("media.errTooLargeShort")}
                  replaceLabel={t("media.replace")}
                  dropReplaceLabel={t("media.dropToReplace")}
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
                  pickerLocale={locale}
              uploadDir="projects"
            />
            <Field label={t("projectForm.field.gallery")}>
              <ImageUploader
                key={`gallery-${restoreNonce}`}
                name="gallery"
                dir="projects"
                multiple
                scope={uploaderScope}
                  pickerLocale={locale}
                browseLabel={t("btn.browse")}
                dropTitle={t("media.dropTitleMany")}
                dropLabel={t("media.dropHere")}
                errTooLargeLabel={t("media.errTooLargeShort")}
                addLabel={t("media.addImage")}
                dropReplaceLabel={t("media.dropToReplace")}
                initial={galleryInitial}
                label={t("projectForm.uploadGalleryImages")}
                removeLabel={t("ui.remove")}
              />
            </Field>
            {/* ── Video (#10/#35) ── a YouTube/Vimeo link OR an uploaded MP4,
                never both — a tab picks the one active source; the inactive
                field unmounts, so it's absent from the submit and the server
                nulls that column. */}
            {/* Sized to its labels, not to the form width: stretched across
                1400px these two read as a pair of banners competing with the
                section heading, when all they do is pick which of two inputs
                shows. */}
            <div className="inline-flex w-fit gap-1 rounded-lg border border-border bg-background p-0.5">
              {(["embed", "upload"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setVideoTab(tab)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    videoTab === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "embed" ? t("projectForm.video.tabEmbed") : t("projectForm.video.tabUpload")}
                </button>
              ))}
            </div>
            {videoTab === "embed" ? (
              <Field label={t("projectForm.field.videoEmbed")}>
                <input
                  name="videoEmbedUrl"
                  defaultValue={data.videoEmbedUrl}
                  placeholder={t("projectForm.videoEmbedPlaceholder")}
                  className={inputCls}
                />
              </Field>
            ) : (
              <Field label={t("projectForm.field.videoFile")}>
                <MediaField
                  key={`video-${restoreNonce}`}
                  name="videoFile"
                  initial={videoFileInitial}
                  label={t("btn.browse")}
                  uploadDir="videos"
                  accept="video"
                  scope={uploaderScope}
                  locale={locale}
                  dropTitle={t("media.dropTitleOne")}
                  dropLabel={t("media.dropHereOne")}
                  errTooLargeLabel={t("media.errTooLargeShort")}
                  replaceLabel={t("media.replace")}
                  removeLabel={t("ui.remove")}
                  dropReplaceLabel={t("media.dropToReplace")}
                />
              </Field>
            )}
          </section>

          {/* ── Cast & crew (inline, #20²) ── */}
          <section id="sec-cast" className="scroll-mt-24 space-y-3 rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">{t("projectForm.section.castCrew")}</h2>
            <ActorsSection
              value={actors}
              onChange={setActors}
              knownPeople={knownPeople}
              t={t}
              scope={uploaderScope}
              pickerLocale={locale}
              nameLocale={mode === "creator" ? locale : "en"}
            />
          </section>

          {/* ── Product placements (owner correction 2026-07-28) — the brand
              inside the story, sitting above Sponsors (the logo-on-materials
              deal, which kept the old "Placement(s)" data/section id below). ── */}
          <section id="sec-placements" className="scroll-mt-24 space-y-3 rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">{t("projectForm.section.placements")}</h2>
            <PlacementsSection value={placements} onChange={setPlacements} t={t} scope={uploaderScope} locale={locale} />
          </section>

          {/* ── Sponsors (was "Placement(s)"/"Sponsorship tiers") ── */}
          <section id="sec-tiers" className="scroll-mt-24 space-y-3 rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">{t("projectForm.section.sponsorshipTiers")}</h2>
            <TiersSection value={tiers} onChange={setTiers} t={t} templates={tierTemplates} />
          </section>

          {/* ── Reference Projects (was the "Comparable titles" field inside
              Design) ── a repeatable {name, url} list (Ф2), mirrored into the
              hidden `references` input at the top of the form. */}
          <section id="sec-references" className="scroll-mt-24 space-y-3 rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">{t("projectForm.section.references")}</h2>
            <ReferencesSection
              value={references}
              onChange={setReferences}
              t={t}
              scope={uploaderScope}
              locale={locale}
            />
          </section>

          {/* ── Production Timeline (Ф4/#27) ── admin-only: a repeatable list of
              production stages rendered as a horizontal timeline on the report
              page. Hidden for the creator form (mode="creator"). */}
          {mode !== "creator" && (
            <section id="sec-milestones" className="scroll-mt-24 space-y-3 rounded-xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">{t("projectForm.section.milestones")}</h2>
              <MilestonesSection value={milestones} onChange={setMilestones} t={t} />
            </section>
          )}
        </div>
        {/* ══ Meta sidebar ══ */}
        <div className="min-w-0 space-y-4">
          {/* ── General ── classification meta: Format (was "Kind"), the
              episodes/episode-length block (Series only, right after Format),
              Genre, Language, Studio, Countries and Age rating — the latter two
              folded in here from the old Status&release / Audience&value cards. */}
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
                      // Keyed by the submit counter so the post-action form
                      // reset can't leave the dial showing the page-load value
                      // — see formEpoch above.
                      key={`kind-${k}-${formEpoch}`}
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
            {/* Runtime is required to PUBLISH, not to save (owner decision
                2026-07-26). It briefly carried `required`, which meant an old
                project without minutes could not be edited at all until they
                were typed in — the server-side publishBlockers() check replaced
                that. The asterisk in the label stays: the field is still
                mandatory before the project can reach the catalog. */}
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
            ) : (
              <Field label={t("projectForm.field.durationMinutes")}>
                <input
                  name="durationMinutes"
                  type="number"
                  min={0}
                  defaultValue={numOrEmpty(data.durationMinutes)}
                  placeholder="95"
                  className={inputCls}
                />
              </Field>
            )}
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
            {/* The Language field was removed on 2026-07-27 (content review).
                The column and the value a project already carries stay — this
                hidden input round-trips it — but nobody is asked to fill it in
                any more, and it is not shown or filtered on anywhere. */}
            <input type="hidden" name="language" value={JSON.stringify(languages)} />
            {/* Studio name moved to Production Info, next to "Available on"
                (owner request 2026-07-27): who made it and where it plays are
                one question, and it sat here between the poster and the money
                fields for no reason. */}
            {/* Two separate money figures (owner decision C.3, 2026-07-26):
                the CSV schema's "Budget" is the production budget, while the
                pre-existing column holds box-office gross. They were being
                conflated under one "Budget" label. */}
            <Field label={t("projectForm.field.productionBudget")}>
              <input
                name="productionBudgetAmd"
                type="number"
                min={0}
                defaultValue={numOrEmpty(data.productionBudgetAmd)}
                className={inputCls}
              />
            </Field>
            {/* Box office was removed on 2026-07-27 (owner request): it is a
                past-performance number, not part of what a brand is buying, and
                it was the only money figure on the card competing with the
                package price. The column stays with its data; nothing asks for
                it or shows it. */}
            {/* Was a free-text field: every editor typed their own spelling
                ("US" / "USA" / "United States") and the catalog counted them as
                three countries. Now a closed list, picked the same way as Genre
                (2026-07-27). A value a project already carries stays as a chip
                even if it isn't on the list. */}
            <Field label={t("projectForm.field.countries")}>
              <MultiSelect
                options={countryOptions}
                value={countries}
                onChange={setCountries}
                name="countries"
                allowCustom
                placeholder={t("projectForm.countriesPlaceholder")}
                addLabel={t("ui.addOption")}
                removeLabel={t("ui.remove")}
                // Deleting is global — every project loses the option — so it
                // is staff-only, never offered in creator mode.
                onDeleteOption={mode === "creator" ? undefined : (v) => setDeletingCountryOption(v)}
              />
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

          {/* ── Production Info ── project status/timeline + where it plays:
              Status, Release date, Application deadline, Available on
              (Platforms + Streaming source merged, #29), Cinemas. The
              ambiguous ones carry a helper hint under the field. */}
          <section id="sec-production" className="scroll-mt-24 space-y-3 rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">{t("projectForm.section.production")}</h2>
            {/* "Production stage" (and its helper text) was removed from both
                editors on 2026-07-26 at the owner's request. The Project.status
                column stays — the public catalog still filters on it and the
                report page still shows it — but nobody edits it here any more,
                which is also why `status` left ProjectFormValues: parsing an
                absent field would have written PRE_PRODUCTION over the real
                value on every save (the same trap the `format` column fell into
                earlier that day). */}
            <Field label={t("projectForm.field.releaseDate")}>
              <input name="releaseDate" type="date" defaultValue={data.releaseDate} className={inputCls} />
            </Field>
            <Field label={t("projectForm.field.applicationDeadline")} hint={t("projectForm.help.placementDeadline")}>
              <input
                name="applicationDeadline"
                type="date"
                defaultValue={data.applicationDeadline}
                className={inputCls}
              />
            </Field>
            {/* Studio name — was a single free-text input with a <datalist> of
                past values (so "Sharm Holding" / "Sharm holding" / "SHARM"
                all coexisted) and no room for a co-production. Now a picker
                over the studio dictionary, with the same escape hatch as
                Countries: type one that isn't listed and it is offered on every
                future project. */}
            <Field label={t("projectForm.field.studio")}>
              <MultiSelect
                options={studioOptions}
                value={studioValues}
                onChange={setStudioValues}
                name="studio"
                allowCustom
                placeholder={t("projectForm.studioPlaceholder")}
                addLabel={t("ui.addOption")}
                removeLabel={t("ui.remove")}
                // Deleting is global — every project loses the option — so it
                // is staff-only, never offered in creator mode.
                onDeleteOption={mode === "creator" ? undefined : (v) => setDeletingStudioOption(v)}
              />
            </Field>
            {/* "Available on" (#29) — Platforms + Streaming source merged into
                one field. Still submits name="platforms" (the public catalog
                Platforms filter reads that column), but now carries the global
                streaming-source dictionary UX (allowCustom + staff-only delete)
                the old Streaming Source field had. */}
            <Field label={t("projectForm.field.availableOn")} hint={t("projectForm.help.availableOn")}>
              <MultiSelect
                options={streamOptions}
                value={platforms}
                onChange={setPlatforms}
                name="platforms"
                allowCustom
                placeholder={t("projectForm.availableOnPlaceholder")}
                addLabel={t("ui.addOption")}
                removeLabel={t("ui.remove")}
                // Deleting a dictionary value is global (every project loses it
                // as an option) and staff-only — never offered in creator mode.
                onDeleteOption={
                  mode === "creator" ? undefined : (v) => setDeletingStreamOption(v)
                }
              />
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
        <p
          ref={errorRef}
          className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm text-primary"
        >
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

      {/* Held navigation: the link click was cancelled, now the user picks.
          "Save and leave" is a plain submit — the post-save effect completes
          the navigation once the action reports success. Rendered inside the
          <form> so that button can submit it directly. */}
      {pendingHref ? (
        <div
          className="fixed inset-0 z-[100] grid place-items-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="leave-dialog-title"
        >
          <div className="absolute inset-0 bg-black/50" onClick={() => setPendingHref(null)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <h2 id="leave-dialog-title" className="text-base font-bold text-foreground">
              {t("projectForm.leaveTitle")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{t("projectForm.leaveMessage")}</p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="submit"
                onClick={() => {
                  leaveAfterSave.current = pendingHref;
                  setPendingHref(null);
                }}
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
              >
                {t("projectForm.leaveSave")}
              </button>
              <button
                type="button"
                onClick={() => {
                  const href = pendingHref;
                  setPendingHref(null);
                  setIsDirty(false); // stop the guard re-firing on the way out
                  if (href) window.location.assign(href);
                }}
                className="inline-flex items-center justify-center rounded-lg border border-danger/40 px-4 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
              >
                {t("projectForm.leaveDiscard")}
              </button>
              <button
                type="button"
                onClick={() => setPendingHref(null)}
                className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("projectForm.leaveStay")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Removing a Streaming Source value takes it away from every project,
          so it gets a styled warning instead of the browser's confirm box. */}
      <ConfirmDialog
        open={deletingStreamOption !== null}
        title={`Delete “${deletingStreamOption ?? ""}” from Streaming Source?`}
        message="It is removed as an option from every project. This cannot be undone."
        confirmLabel="Delete"
        pending={streamOptionPending}
        onCancel={() => setDeletingStreamOption(null)}
        onConfirm={() => {
          const value = deletingStreamOption;
          if (!value) return;
          startStreamOptionTransition(async () => {
            await deleteStreamingSource(value);
            setStreamOptions((opts) => opts.filter((x) => x !== value));
            setPlatforms((sel) => sel.filter((x) => x !== value));
            setDeletingStreamOption(null);
          });
        }}
      />

      <ConfirmDialog
        open={deletingCountryOption !== null}
        title={`Delete “${deletingCountryOption ?? ""}” from the country list?`}
        message="It stops being offered on every project. Projects that already list it keep it."
        confirmLabel="Delete"
        pending={countryOptionPending}
        onCancel={() => setDeletingCountryOption(null)}
        onConfirm={() => {
          const value = deletingCountryOption;
          if (!value) return;
          startCountryOptionTransition(async () => {
            await deleteCountry(value);
            setCountryOptions((opts) => opts.filter((x) => x !== value));
            setCountries((sel) => sel.filter((x) => x !== value));
            setDeletingCountryOption(null);
          });
        }}
      />

      <ConfirmDialog
        open={deletingStudioOption !== null}
        title={`Delete “${deletingStudioOption ?? ""}” from the studio list?`}
        message="It stops being offered on every project. Projects that already list it keep it."
        confirmLabel="Delete"
        pending={studioOptionPending}
        onCancel={() => setDeletingStudioOption(null)}
        onConfirm={() => {
          const value = deletingStudioOption;
          if (!value) return;
          startStudioOptionTransition(async () => {
            await deleteStudio(value);
            setStudioOptions((opts) => opts.filter((x) => x !== value));
            setStudioValues((sel) => sel.filter((x) => x !== value));
            setDeletingStudioOption(null);
          });
        }}
      />
    </form>
  );
}
