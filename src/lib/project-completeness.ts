// "What a brand sees" checklist (audit B8) — a pure, DB/React-free module so
// it's usable from both the server (edit pages, computing what's saved) and
// the client (the panel that renders it). Every empty block on the public
// report page just doesn't render (see the `return null` guards in
// src/components/report/*.tsx) — worst of all for placements, the project's
// main product, which is NOT among the publish blockers below. This gives the
// creator/admin a named list of what's missing instead of a page that looks
// "done" with the storefront's centerpiece silently absent.
import { parseReferencesInput, PLACEMENTS_REQUIRED_FROM } from "@/app/admin/(panel)/projects/form-shared";

export type CompletenessKey =
  | "tagline"
  | "translations"
  | "studio"
  | "runtime"
  | "poster"
  | "video"
  | "gallery"
  | "cast"
  | "castPhotos"
  | "milestones"
  | "placements"
  | "placementPricing"
  | "tiers"
  | "references"
  | "deadline"
  | "releaseDate"
  | "platforms"
  | "cinemas"
  | "countries"
  | "budget"
  | "ageRating"
  | "formatCategory";

export type CompletenessItem = {
  key: CompletenessKey;
  filled: boolean;
  /** Mirrors form-shared.ts publishBlockers() — true for the handful of
   *  fields that block PUBLICATION, not just save (see that module). */
  blocksPublish: boolean;
};

// The saved-project shape this reads. Deliberately structural (not imported
// from @prisma/client) so this module carries no Prisma dependency; the edit
// pages already have a Prisma row and pass its fields straight through.
export type CompletenessInput = {
  tagline: string;
  studio: string | null;
  /** "SERIAL" | "FILM" — decides which runtime fields count. */
  kind: string;
  episodes: number | null;
  episodeMinutes: number | null;
  durationMinutes: number | null;
  poster: string | null;
  videoEmbedUrl: string | null;
  videoFile: string | null;
  gallery: string | null; // JSON string[]
  castCount: number;
  milestonesCount: number;
  placementsCount: number;
  /** Rows, not a count: publication needs every package to carry a benefits
      list, so "there is one package" isn't the same as "the package is
      publishable". */
  tiers: { benefits: string | null }[];
  references: string | null; // JSON [{name,url,media}] or legacy CSV
  applicationDeadline: Date | string | null;
  // Ongoing (IA-42) counts as a filled-in deadline — it's a deliberate
  // "always open" choice, not the absence of one.
  applicationDeadlineOngoing: boolean;
  releaseDate: Date | string | null;
  platforms: string | null; // JSON string[]
  cinemas: string | null; // comma-separated
  productionBudgetAmd: number | null;
  ageRating: string | null;
  /** FEATURE | SERIES | SITCOM | … — the bucket the catalog's Format filter
   *  works on. Empty means the project is missing from that filter entirely,
   *  which is a way of being invisible that no section on the page shows. */
  formatCategory: string | null;
  /** Distribution countries, comma-separated — same convention as `cinemas`.
   *  Shown in the report page's facts block. Optional: the lightweight
   *  "Incomplete: N" badge on the project list pages only fetches counts, not
   *  this column, so it's fine for that caller to omit it entirely — an
   *  absent value simply reads as unfilled, same as every other field here
   *  that's missing. */
  countries?: string | null;
  /** Cast/crew rows that carry an uploaded photo. "There is a cast" (the
   *  `cast` item above) isn't the same as "the cast has faces" — a project can
   *  list ten names with zero photos and still pass that item. Optional for
   *  the same reason as `countries` above: the list-badge callers only fetch a
   *  bare actor COUNT, not the rows, so they can't tell photographed from
   *  faceless and simply don't supply this. */
  castPhotoCount?: number;
  /** Per-locale title/synopsis/tagline (2026-08-04) — the base `tagline`
   *  field above (and title/synopsis, which have no section of their own)
   *  only need ONE locale filled in, so a project can be entirely Armenian
   *  while an English-reading brand sees nothing but Armenian text. This item
   *  is the one built to catch exactly that: it's filled only once every one
   *  of these nine fields is non-empty in every locale. Optional/omitted (the
   *  list-badge callers) reads as unfilled, same as the rest. */
  titleHy?: string | null;
  titleRu?: string | null;
  titleEn?: string | null;
  synopsisHy?: string | null;
  synopsisRu?: string | null;
  synopsisEn?: string | null;
  taglineHy?: string | null;
  taglineRu?: string | null;
  taglineEn?: string | null;
  /** Placement prices. A placement with no price legitimately shows as "on
   *  request" on the report page — this is NOT a publish blocker — but the
   *  checklist still tells the creator how many of their placements are
   *  unpriced. Filled once at least one row carries a price. Optional for the
   *  same "list-badge callers only have a count" reason as above. */
  placementPricing?: { priceAmd: number | null }[];
  /** When this project was created — feeds the placements grandfather clause
   *  (PLACEMENTS_REQUIRED_FROM, form-shared.ts) so this module's blocksPublish
   *  flag for the "placements" key agrees with what publishBlockers() actually
   *  enforces (owner decision 2026-08-04: the 8 pre-existing prod projects,
   *  built entirely on sponsorship tiers, are exempt from the placements
   *  requirement; nothing else is). Optional/omitted (the list-badge callers,
   *  which don't render blocksPublish at all) is treated as "not exempt" — the
   *  same conservative default publishBlockers() uses for a brand-new project. */
  createdAt?: Date | null;
};

/** JSON string[] (or null/malformed) -> true if it holds at least one entry.
   Same tolerance as the parseJsonList/parseStringArray helpers elsewhere. */
function hasJsonListEntry(json: string | null): boolean {
  if (!json) return false;
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) && arr.length > 0;
  } catch {
    return false;
  }
}

/** Mirrors publishBlockers() (form-shared.ts) exactly: studio, tagline, the
   runtime/episode fields, tiers with a benefits list, plus — added
   2026-08-04 — poster, formatCategory and an explicit deadline decision.
   Release date was dropped from this list on 2026-08-01 (IA-42) — it must
   stay optional and support an imprecise (year/month-only) value, neither of
   which fits a hard publish gate. Studio and runtime have no section of their
   own on the public page — they are a line in the facts block and the format
   chip — but they belong here anyway: a checklist that says "everything is
   filled in" and is then refused at publication is worse than no checklist.
   The four new items in part (b) below (countries, castPhotos, translations,
   placementPricing) are deliberately NOT in this set — they're advisory only,
   same as milestones/references/etc.

   "placements" is deliberately NOT in this static set either, even though
   publishBlockers() does check it — unlike every other entry here, whether it
   blocks publication depends on the PROJECT (grandfathered for anything
   created before PLACEMENTS_REQUIRED_FROM), not just on the field's own
   filled-in-ness. It's computed per-project below instead, from the same
   cutoff publishBlockers() uses, so the two still agree exactly — just not
   through this set. */
const BLOCKS_PUBLISH: ReadonlySet<CompletenessKey> = new Set([
  "tagline",
  "studio",
  "runtime",
  "tiers",
  "poster",
  "formatCategory",
  "deadline",
]);

export function projectCompleteness(input: CompletenessInput): CompletenessItem[] {
  // A reference row counts as filled the same way the public page does
  // (src/lib/data/projects.ts): a title OR an uploaded still/clip, not a bare
  // empty row.
  const referenceRows = parseReferencesInput(input.references ?? "").filter((r) => r.name || r.media);

  // publishBlockers() accepts a package only when it has both a name and a
  // benefits list, so a nameless or benefit-less row must not read as "filled".
  const publishableTiers = input.tiers.filter((tier) => (tier.benefits ?? "").trim());

  // All nine locale fields non-empty — see the CompletenessInput comment for
  // why this needs every locale, not just one.
  const allLocalesFilled = [
    input.titleHy, input.titleRu, input.titleEn,
    input.synopsisHy, input.synopsisRu, input.synopsisEn,
    input.taglineHy, input.taglineRu, input.taglineEn,
  ].every((v) => !!(v && v.trim()));

  const filled: Record<CompletenessKey, boolean> = {
    tagline: !!input.tagline.trim(),
    translations: allLocalesFilled,
    studio: !!(input.studio && input.studio.trim()),
    runtime:
      input.kind === "SERIAL"
        ? !!input.episodes && !!input.episodeMinutes
        : !!input.durationMinutes,
    poster: !!input.poster,
    video: !!input.videoEmbedUrl || !!input.videoFile,
    gallery: hasJsonListEntry(input.gallery),
    cast: input.castCount > 0,
    castPhotos: (input.castPhotoCount ?? 0) > 0,
    milestones: input.milestonesCount > 0,
    placements: input.placementsCount > 0,
    placementPricing: (input.placementPricing ?? []).some((p) => p.priceAmd != null),
    tiers: publishableTiers.length > 0,
    references: referenceRows.length > 0,
    deadline: !!input.applicationDeadline || input.applicationDeadlineOngoing,
    releaseDate: !!input.releaseDate,
    platforms: hasJsonListEntry(input.platforms),
    cinemas: !!(input.cinemas && input.cinemas.trim()),
    countries: !!(input.countries && input.countries.trim()),
    budget: input.productionBudgetAmd != null,
    ageRating: !!(input.ageRating && input.ageRating.trim()),
    formatCategory: !!(input.formatCategory && input.formatCategory.trim()),
  };

  // Same cutoff rule as publishBlockers()'s placementsRequired: no createdAt
  // (a project being created right now) or created at/after the cutoff means
  // the requirement applies; anything older is grandfathered.
  const placementsBlocksPublish =
    input.createdAt == null || input.createdAt >= PLACEMENTS_REQUIRED_FROM;

  return (Object.keys(filled) as CompletenessKey[]).map((key) => ({
    key,
    filled: filled[key],
    blocksPublish: key === "placements" ? placementsBlocksPublish : BLOCKS_PUBLISH.has(key),
  }));
}

export function missingCount(items: CompletenessItem[]): number {
  return items.filter((item) => !item.filled).length;
}
