// "What a brand sees" checklist (audit B8) — a pure, DB/React-free module so
// it's usable from both the server (edit pages, computing what's saved) and
// the client (the panel that renders it). Every empty block on the public
// report page just doesn't render (see the `return null` guards in
// src/components/report/*.tsx) — worst of all for placements, the project's
// main product, which is NOT among the publish blockers below. This gives the
// creator/admin a named list of what's missing instead of a page that looks
// "done" with the storefront's centerpiece silently absent.
import { parseReferencesInput } from "@/app/admin/(panel)/projects/form-shared";

export type CompletenessKey =
  | "tagline"
  | "studio"
  | "runtime"
  | "poster"
  | "video"
  | "gallery"
  | "cast"
  | "milestones"
  | "placements"
  | "tiers"
  | "references"
  | "deadline"
  | "releaseDate"
  | "platforms"
  | "cinemas"
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
  releaseDate: Date | string | null;
  platforms: string | null; // JSON string[]
  cinemas: string | null; // comma-separated
  productionBudgetAmd: number | null;
  ageRating: string | null;
  /** FEATURE | SERIES | SITCOM | … — the bucket the catalog's Format filter
   *  works on. Empty means the project is missing from that filter entirely,
   *  which is a way of being invisible that no section on the page shows. */
  formatCategory: string | null;
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

/** Mirrors publishBlockers() (form-shared.ts) exactly: studio, releaseDate,
   tagline, the runtime/episode fields, and tiers with a benefits list. Studio
   and runtime have no section of their own on the public page — they are a
   line in the facts block and the format chip — but they belong here anyway:
   a checklist that says "everything is filled in" and is then refused at
   publication is worse than no checklist. */
const BLOCKS_PUBLISH: ReadonlySet<CompletenessKey> = new Set([
  "tagline",
  "studio",
  "runtime",
  "releaseDate",
  "tiers",
]);

export function projectCompleteness(input: CompletenessInput): CompletenessItem[] {
  // A reference row counts as filled the same way the public page does
  // (src/lib/data/projects.ts): a title OR an uploaded still/clip, not a bare
  // empty row.
  const referenceRows = parseReferencesInput(input.references ?? "").filter((r) => r.name || r.media);

  // publishBlockers() accepts a package only when it has both a name and a
  // benefits list, so a nameless or benefit-less row must not read as "filled".
  const publishableTiers = input.tiers.filter((tier) => (tier.benefits ?? "").trim());

  const filled: Record<CompletenessKey, boolean> = {
    tagline: !!input.tagline.trim(),
    studio: !!(input.studio && input.studio.trim()),
    runtime:
      input.kind === "SERIAL"
        ? !!input.episodes && !!input.episodeMinutes
        : !!input.durationMinutes,
    poster: !!input.poster,
    video: !!input.videoEmbedUrl || !!input.videoFile,
    gallery: hasJsonListEntry(input.gallery),
    cast: input.castCount > 0,
    milestones: input.milestonesCount > 0,
    placements: input.placementsCount > 0,
    tiers: publishableTiers.length > 0,
    references: referenceRows.length > 0,
    deadline: !!input.applicationDeadline,
    releaseDate: !!input.releaseDate,
    platforms: hasJsonListEntry(input.platforms),
    cinemas: !!(input.cinemas && input.cinemas.trim()),
    budget: input.productionBudgetAmd != null,
    ageRating: !!(input.ageRating && input.ageRating.trim()),
    formatCategory: !!(input.formatCategory && input.formatCategory.trim()),
  };

  return (Object.keys(filled) as CompletenessKey[]).map((key) => ({
    key,
    filled: filled[key],
    blocksPublish: BLOCKS_PUBLISH.has(key),
  }));
}

export function missingCount(items: CompletenessItem[]): number {
  return items.filter((item) => !item.filled).length;
}
