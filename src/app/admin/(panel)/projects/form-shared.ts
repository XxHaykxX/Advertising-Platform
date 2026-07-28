/* Pure, sync helpers + constants shared between the project server actions and
   the client form. Kept out of actions.ts because a "use server" module may
   only export async functions. */

export const KIND_VALUES = ["FILM", "SERIAL"] as const;

// Marketing format bucket (drives the catalog Format filter) — distinct from
// KIND_VALUES, which only decides episode fields. Labeled via
// t(`formatCategory.${v}`) / localizeValue(locale, "formatCategory", v).
export const FORMAT_CATEGORY_VALUES = [
  "FEATURE",
  "SERIES",
  // Added 2026-07-27 from the localization sheet — the content writer listed
  // five formats the catalog had no bucket for, all of which exist in the
  // Armenian market (mini-series, YouTube shows, documentaries, animation and
  // live events).
  "MINISERIES",
  "YOUTUBESHOW",
  "DOCUMENTARY",
  "ANIMATION",
  "EVENTS",
  "SITCOM",
  "PODCAST",
  "REALITY",
  "PROGRAM",
  "SHORT",
] as const;

// Primary-language bucket. The Language field and its catalog facet were
// removed on 2026-07-27 (content review), so nothing offers these as a choice
// any more — the list stays because the `language` column still holds the
// values entered before that, and a future field would use the same set.
export const LANGUAGE_VALUES = ["Armenian", "Russian", "English", "Georgian", "Other"] as const;

// Fall back to a sensible Format bucket when a row has no explicit
// formatCategory. That column was added late (default "") so every pre-existing
// and seed row is blank — without this the catalog Format filter matches nothing
// for that data. A saved value always wins; otherwise we infer from the
// free-text `format`/`genre` (which carry "Series"/"Feature"/… tokens), and only
// then from `kind`. Buckets with no matching data (Sitcom/Podcast/Reality/…)
// legitimately stay empty. Keep in sync with FORMAT_CATEGORY_VALUES.
export function deriveFormatCategory(
  formatCategory: string,
  kind: string,
  hint = "",
): string {
  if (formatCategory) return formatCategory;
  const t = hint.toLowerCase();
  if (/\bsitcom\b|ситком|սիթքոմ/.test(t)) return "SITCOM";
  if (/podcast|подкаст|փոդքաստ/.test(t)) return "PODCAST";
  if (/reality|реалит|ռեալիթի/.test(t)) return "REALITY";
  if (/\bshort\b|короткометр|կարճամետրաժ/.test(t)) return "SHORT";
  if (/series|serial|сериал|սերիал/.test(t)) return "SERIES";
  if (/program|переда|հաղորդում/.test(t)) return "PROGRAM";
  if (/feature|documentary|\bfilm\b|\bmovie\b|фильм|филм|ֆիլմ|վավերագր/.test(t)) return "FEATURE";
  if (kind === "SERIAL") return "SERIES";
  if (kind === "FILM") return "FEATURE";
  return "";
}

export const AGE_RATING_VALUES = ["", "0+", "6+", "12+", "16+", "18+"] as const;

// Cast & crew ROLES (Ф3) — a fixed, searchable multi-select replacing the old
// free-text Role field. One person can hold several (e.g. Director + Writer).
// English only (localizeValue(locale, "role", v) still handles report-page
// translation, same as the legacy free-text values).
export const ROLE_VALUES = [
  "Actor",
  "Director",
  "Writer",
  "Producer",
  "Music",
  "Show Host",
  "Showrunner",
  "General Producer",
  "Executive Producer",
  "Voice Actor",
  "Singer",
  "Performer",
  "Stand-up Comedian",
  "Animator",
  "Line Producer",
  "Creative Producer",
  "Host",
  "Guest",
] as const;

// Which of ROLE_VALUES belong behind the camera. The CAST/CREW split used to be
// a separate dropdown next to Role; it's now DERIVED from the picked role (user
// request 2026-07-26 — "instead of choosing between those two, we pick from
// these roles"), so the editors only ask for the role and the report page keeps
// its two groups. Anything not listed here counts as CAST (on-screen talent).
const CREW_ROLES: ReadonlySet<string> = new Set([
  "Director",
  "Writer",
  "Producer",
  "Music",
  "Showrunner",
  "General Producer",
  "Executive Producer",
  "Animator",
  "Line Producer",
  "Creative Producer",
]);

/** Role (one of ROLE_VALUES, or a legacy free-text value) -> "CAST" | "CREW".
   Unknown/blank roles fall back to CAST, matching the old default. */
export function kindForRole(role: string): "CAST" | "CREW" {
  return CREW_ROLES.has((role || "").trim()) ? "CREW" : "CAST";
}

// ── Publish-time requirements (owner decision, 2026-07-26) ────────────────
// The customer's CSV schema marks Studio / Release Date / Logline / at least
// one placement package as required, but the owner was explicit: a missing
// required field must block PUBLICATION, never the save. A half-filled project
// always stores fine — it just can't reach the public catalog until it's
// complete. (That is also why Duration, made save-blocking on 2026-07-26, was
// moved back here: an old project without minutes could no longer be edited at
// all.)
//
// Returns dictionary keys, not sentences, so every caller — the admin form,
// the creator submission and the moderator's approve button — renders the same
// list in the reader's own language.

export type PublishCheckInput = {
  studio: string;
  releaseDate: string; // "YYYY-MM-DD" or ""
  tagline: string; // base/fallback logline (derived from the per-locale fields)
  kind: string; // "FILM" | "SERIAL"
  episodes: number | null;
  episodeMinutes: number | null;
  durationMinutes: number | null;
  tiers: { name: string; benefits: string }[];
};

/** Everything that still blocks publication, as i18n keys (empty = publishable). */
export function publishBlockers(input: PublishCheckInput): string[] {
  const missing: string[] = [];
  if (!input.studio.trim()) missing.push("publish.missing.studio");
  if (!input.releaseDate) missing.push("publish.missing.releaseDate");
  if (!input.tagline.trim()) missing.push("publish.missing.tagline");
  if (input.kind === "SERIAL") {
    if (!input.episodes || !input.episodeMinutes) missing.push("publish.missing.episodes");
  } else if (!input.durationMinutes) {
    missing.push("publish.missing.duration");
  }
  const tiers = input.tiers.filter((tier) => tier.name.trim());
  if (tiers.length === 0) {
    missing.push("publish.missing.tiers");
  } else if (tiers.some((tier) => !tier.benefits.trim())) {
    // CSV requires both a Placement Name and a Placement Description; the
    // description is the tier's benefits list.
    missing.push("publish.missing.tierBenefits");
  }
  return missing;
}

/** Date | null -> "YYYY-MM-DD" for prefilling an <input type=date>. */
export function formatDateInput(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : "";
}

/** JSON string[] (or null) -> "YouTube, Kinodaran, TV" for the form. */
export function parsePlatformsInput(json: string | null): string {
  if (!json) return "";
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.join(", ") : "";
  } catch {
    return "";
  }
}

/** JSON string[] (or null) -> newline-separated image URLs for the gallery textarea. */
export function parseGalleryInput(json: string | null): string {
  if (!json) return "";
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.join("\n") : "";
  } catch {
    return "";
  }
}

/** JSON string[] (or null) -> newline-separated benefits for the tier editor. */
export function parseBenefitsInput(json: string | null): string {
  if (!json) return "";
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.join("\n") : "";
  } catch {
    return "";
  }
}

/** "a, b, c" -> ["a", "b", "c"] for prefilling a MultiSelect from a
   comma-separated (countries/platforms/cinemas) form string. */
export function parseCsvInput(csv: string): string[] {
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** One node of the per-project production timeline (Ф4/#27). Free-text label +
   an optional date (YYYY-MM-DD picker value) + one free-text note; `active`
   marks the current stage (highlighted). Ordering is array order. Mirrored into
   a hidden `milestonesRows` JSON input, same pattern as actorsRows/tiersRows. */
export type MilestoneRow = { label: string; date: string; note: string; active: boolean };

export const EMPTY_MILESTONE: MilestoneRow = { label: "", date: "", note: "", active: false };

/** JSON string (or null) -> MilestoneRow[] for the repeatable Production
   Timeline editor. Non-array / malformed input -> []. */
export function parseMilestonesInput(raw: string | null): MilestoneRow[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) {
      return arr
        .filter((r) => r && typeof r === "object")
        .map((r) => ({
          label: String(r.label || ""),
          date: String(r.date || ""),
          note: String(r.note || ""),
          active: !!r.active,
        }));
    }
  } catch {
    // not JSON — nothing to prefill
  }
  return [];
}

export type ReferenceRow = {
  name: string;
  url: string;
  /** Uploaded image or video for this reference ("/uploads/…"), picked from the
   *  media library. The customer's CSV schema allows a past project to be shown
   *  as a link OR as an image; only the link half existed until 2026-07-26. */
  media?: string;
};

/** JSON string (or legacy CSV) -> ReferenceRow[] for the repeatable Reference
   Projects editor. New saves store JSON [{name,url}]; rows saved before this
   editor existed are a plain comma-separated string ("Ray, Bohemian
   Rhapsody") — those fall back to one row per title with an empty url. */
export function parseReferencesInput(raw: string): ReferenceRow[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr) && arr.every((r) => r && typeof r === "object")) {
      return arr.map((r) => ({
        name: String(r.name || ""),
        url: String(r.url || ""),
        media: String(r.media || ""),
      }));
    }
  } catch {
    // not JSON — legacy comma-separated string, fall through
  }
  return parseCsvInput(raw).map((name) => ({ name, url: "" }));
}

/** Multi-genre JSON string[] (or null) -> string[], falling back to the
   legacy single `genre` column when `genres` was never set (pre-migration
   rows). Used to prefill the Genre MultiSelect on edit. */
export function parseGenresInput(json: string | null, legacyGenre: string): string[] {
  if (json) {
    try {
      const arr = JSON.parse(json);
      if (Array.isArray(arr) && arr.length) return arr;
    } catch {
      // fall through to legacy
    }
  }
  return legacyGenre ? [legacyGenre] : [];
}

/** Collapse the tiers stored across all projects into one offer per distinct
   name, most-used first — the "ready-made placements" menu. Lives here (not in
   lib/data) so the grouping rules are testable without a database.

   Names match case-insensitively after trimming, because the same placement
   arrives as "Official sponsor" and "Official Sponsor". Of two variants the
   longer benefits list wins: a template with more lines is easier to trim than
   an empty one is to write. */
export function mergeTierTemplates(
  rows: { name: string; benefits: string | null }[],
  limit = 12,
): { name: string; benefits: string; uses: number }[] {
  const byName = new Map<string, { name: string; benefits: string; uses: number }>();

  for (const row of rows) {
    const name = (row.name || "").trim();
    if (!name) continue;
    const key = name.toLowerCase();
    const benefits = parseBenefitsInput(row.benefits);
    const seen = byName.get(key);

    if (!seen) {
      byName.set(key, { name, benefits, uses: 1 });
      continue;
    }

    seen.uses += 1;
    if (benefits.length > seen.benefits.length) seen.benefits = benefits;
  }

  return [...byName.values()]
    .sort((a, b) => b.uses - a.uses || a.name.localeCompare(b.name))
    .slice(0, limit);
}

/** Group a run of digits into thousands with a non-breaking space: an AMD
   price runs to seven figures, and "1500000" can't be checked by eye. Only
   used for DISPLAY — the row keeps a plain number. */
export function groupDigits(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** The slot columns of a sponsorship tier. Kept structural so these helpers
   stay usable from the client editor without importing its TierRow type (that
   module is "use client"). */
type SlotRow = {
  isExclusive: boolean;
  availableSlots: number | null;
  totalSlots: number | null;
};

/** Typing the total also fills Available, which is what a fresh tier always
   wants — nothing is sold yet. Once the two differ (a slot got taken), the
   entered Available is left alone. */
export function withTotalSlots<T extends SlotRow>(row: T, totalSlots: number | null): T {
  const diverged = row.availableSlots !== null && row.availableSlots !== row.totalSlots;
  return { ...row, totalSlots, availableSlots: diverged ? row.availableSlots : totalSlots };
}

/** "Exclusive" means exactly one buyer, so it sets Total to 1 rather than
   leaving a checkbox that contradicts a Total of 5. Available is clamped, not
   raised: if the single slot is already taken (0), checking the box must not
   put it back on sale. Unchecking leaves the numbers as they are — there's no
   previous total to restore to. */
export function withExclusive<T extends SlotRow>(row: T, isExclusive: boolean): T {
  if (!isExclusive) return { ...row, isExclusive };
  return {
    ...row,
    isExclusive,
    totalSlots: 1,
    availableSlots: row.availableSlots === null ? 1 : Math.min(row.availableSlots, 1),
  };
}

/** Actor.roles multi-role JSON string[] (or null) -> string[], falling back to
   the legacy single `role` column when `roles` was never set (pre-Ф3 rows).
   Same "JSON-first, legacy-fallback" shape as parseGenresInput above. */
export function parseRolesInput(json: string | null, legacyRole: string): string[] {
  if (json) {
    try {
      const arr = JSON.parse(json);
      if (Array.isArray(arr) && arr.length) return arr;
    } catch {
      // fall through to legacy
    }
  }
  return legacyRole ? [legacyRole] : [];
}
