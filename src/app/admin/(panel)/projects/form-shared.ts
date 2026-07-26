/* Pure, sync helpers + constants shared between the project server actions and
   the client form. Kept out of actions.ts because a "use server" module may
   only export async functions. */

export const PLACEMENT_TYPE_VALUES = ["In-Frame", "Story Integration", "Mention"] as const;

export const KIND_VALUES = ["FILM", "SERIAL"] as const;

// Marketing format bucket (drives the catalog Format filter) — distinct from
// KIND_VALUES, which only decides episode fields. Labeled via
// t(`formatCategory.${v}`) / localizeValue(locale, "formatCategory", v).
export const FORMAT_CATEGORY_VALUES = [
  "FEATURE",
  "SERIES",
  "SITCOM",
  "PODCAST",
  "REALITY",
  "PROGRAM",
  "SHORT",
] as const;

// Primary-language bucket (catalog Language filter). Labeled via
// t(`language.${v}`) / localizeValue(locale, "language", v).
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
  expectedReleaseDate: string; // "YYYY-MM-DD" or ""
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
  // Either date satisfies the CSV's "Release Date": a released title has a real
  // one, an upcoming title has the expected one.
  if (!input.releaseDate && !input.expectedReleaseDate) missing.push("publish.missing.releaseDate");
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

export type ReferenceRow = { name: string; url: string };

/** JSON string (or legacy CSV) -> ReferenceRow[] for the repeatable Reference
   Projects editor. New saves store JSON [{name,url}]; rows saved before this
   editor existed are a plain comma-separated string ("Ray, Bohemian
   Rhapsody") — those fall back to one row per title with an empty url. */
export function parseReferencesInput(raw: string): ReferenceRow[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr) && arr.every((r) => r && typeof r === "object")) {
      return arr.map((r) => ({ name: String(r.name || ""), url: String(r.url || "") }));
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
