/* Pure, sync helpers + constants shared between the project server actions and
   the client form. Kept out of actions.ts because a "use server" module may
   only export async functions. */

export const KIND_VALUES = ["FILM", "SERIAL"] as const;

// How much of `releaseDate` the editor actually entered (IA-42, 2026-08-01) —
// an exact date, a month + year, or a bare year. The stored date sits at that
// precision's placeholder (YEAR -> YYYY-01-01, MONTH -> YYYY-MM-01); this is
// the column that decides how much of it is safe to show, so the site never
// renders a day/month nobody actually gave it.
export const RELEASE_PRECISION_VALUES = ["DAY", "MONTH", "YEAR"] as const;
export type ReleasePrecision = (typeof RELEASE_PRECISION_VALUES)[number];

/** The Project.releasePrecision column is a plain String (no DB enum), so a
   row somehow carrying anything else falls back to DAY here — same
   "tolerate bad data, don't crash the edit page" reasoning as parseGenresInput
   and friends elsewhere in this file. */
export function normalizeReleasePrecision(v: string): ReleasePrecision {
  return (RELEASE_PRECISION_VALUES as readonly string[]).includes(v) ? (v as ReleasePrecision) : "DAY";
}

// Sane bounds for a bare release year — MySQL's DATETIME range is much wider,
// but nothing about a placement listing needs a year outside a human
// lifetime either side of now, and it keeps a fat-fingered "20277" (see
// RELEASE_DATE_SHAPE below — the shape check alone lets it through, since it
// IS four digits) from reaching dateOrNull and overflowing the column.
export const RELEASE_YEAR_MIN = 1900;
export const RELEASE_YEAR_MAX = 2100;

// Exactly the three shapes the precision picker can submit — an ISO date-only
// form at each precision, which is also the one thing dateOrNull's `new
// Date(value)` parses as UTC unambiguously (a date-TIME string with no
// timezone parses in the SERVER's local time instead, per the ECMAScript
// spec, and Hostinger's server is not UTC). Enforcing the shape here means
// dateOrNull never has to guess: whatever reaches it is already one of these.
const RELEASE_DATE_SHAPE: Record<ReleasePrecision, RegExp> = {
  DAY: /^\d{4}-\d{2}-\d{2}$/,
  MONTH: /^\d{4}-\d{2}$/,
  YEAR: /^\d{4}$/,
};

/** Validate a release-date form value against the precision it claims to be
   at (review finding, 2026-08-02). Release date is optional — an empty value
   always passes, precision is irrelevant to a value that isn't there.
   Returns an error code, or null when the value is fine:
     "shape" — doesn't match its precision's exact format at all. The
       concrete trigger: desktop Firefox/Safari don't implement
       `<input type="month">` and silently degrade it to a plain text box, so
       whatever the editor typed ("Май 2027") reaches the server unchecked
       without this. A crafted request hitting the same gap.
     "range" — syntactically a fine 4-digit year, but outside a sane window
       (see RELEASE_YEAR_MIN/MAX). */
export function validateReleaseDateValue(
  value: string,
  releasePrecision: ReleasePrecision,
): "shape" | "range" | null {
  if (!value) return null;
  if (!RELEASE_DATE_SHAPE[releasePrecision].test(value)) return "shape";
  const year = parseInt(value.slice(0, 4), 10);
  if (year < RELEASE_YEAR_MIN || year > RELEASE_YEAR_MAX) return "range";
  return null;
}

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
  // Documentary and animation are their own buckets AND their own genres, so
  // they have to be matched before the catch-all film branch below. Until
  // 2026-08-05 "documentary" fell into that branch and came back as FEATURE,
  // and animation matched nothing at all — a cartoon series was filed as a
  // plain feature film. Both words are in GENRES, so this fires on real data.
  if (/documentary|документальн|վավերագր/.test(t)) return "DOCUMENTARY";
  if (/animation|cartoon|анимац|мультф|անիմաց/.test(t)) return "ANIMATION";
  if (/feature|\bfilm\b|\bmovie\b|фильм|филм|ֆիլմ/.test(t)) return "FEATURE";
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
  tagline: string; // base/fallback logline (derived from the per-locale fields)
  kind: string; // "FILM" | "SERIAL"
  episodes: number | null;
  episodeMinutes: number | null;
  durationMinutes: number | null;
  tiers: { name: string; benefits: string }[];
  poster: string | null;
  // Count, not rows — every caller already has the row count for free (the
  // form's parsed placementsRows, or a DB _count), and publishBlockers only
  // ever needs to know whether it's zero.
  placementsCount: number;
  formatCategory: string | null;
  applicationDeadline: Date | string | null;
  applicationDeadlineOngoing: boolean;
  // Grandfathers the placements requirement below — see PLACEMENTS_REQUIRED_FROM.
  // null for a project being CREATED right now (never grandfathered, there is
  // no "before" to exempt); a Date for an existing row, taken from its saved
  // createdAt.
  createdAt: Date | null;
};

// The eight projects already live on prod when the placements requirement
// shipped were all built on sponsorship tiers alone — the placement feature
// had no adoption in practice, and two of the eight already fail today's tier
// gate on an unrelated field (blank benefits). Refusing all eight at their
// next re-approval was the owner's explicit call NOT to make (2026-08-04); a
// blank poster, formatCategory or deadline decision gets no such exemption —
// only placements does. The cutoff is a dated constant, not a hardcoded id
// list, so it reads as a decision anyone can find later, not a mystery
// exception: anything CREATED before this ships is exempt, anything created
// at or after it is held to the requirement like every other field.
// NB: nudge this if the ship date slips — it must land AFTER this code goes
// live, or a project created between the two dates would wrongly dodge the
// requirement.
export const PLACEMENTS_REQUIRED_FROM = new Date("2026-08-05T00:00:00Z");

/** Everything that still blocks publication, as i18n keys (empty = publishable). */
export function publishBlockers(input: PublishCheckInput): string[] {
  const missing: string[] = [];
  if (!input.studio.trim()) missing.push("publish.missing.studio");
  // Release date is deliberately NOT checked here (IA-42, 2026-08-01, owner
  // request): it must be fully optional and support an imprecise (year- or
  // month-only) value, so it can no longer be a hard publish requirement.
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
  // A blank poster is invisible on the storefront's own terms, not just an
  // incomplete-looking page: the catalog card and every hero on the report
  // page have nothing to render where the poster goes (the `return null`
  // guards project-completeness.ts's header comment points at), so a brand
  // scrolling the catalog sees a gap in the grid where this listing should be.
  if (!input.poster || !input.poster.trim()) missing.push("publish.missing.poster");
  // Zero placements is the hole project-completeness.ts's header comment
  // names outright: a placement is the project's actual PRODUCT — the thing a
  // brand is here to buy — and nothing above this line ever checked for one.
  // Without this, a project could publish as a storefront with nothing on the
  // shelf. Grandfathered for anything that already existed when this shipped
  // — see PLACEMENTS_REQUIRED_FROM.
  const placementsRequired = input.createdAt == null || input.createdAt >= PLACEMENTS_REQUIRED_FROM;
  if (placementsRequired && input.placementsCount <= 0) missing.push("publish.missing.placements");
  // A blank formatCategory doesn't just look empty on the page — it drops the
  // project out of the catalog's Format filter (Feature/Series/…) entirely,
  // so a brand filtering by format never sees it, not even as
  // "Uncategorized".
  if (!input.formatCategory || !input.formatCategory.trim()) missing.push("publish.missing.formatCategory");
  // Neither a concrete deadline nor the explicit Ongoing flag: the report
  // page's placement-window copy has nothing to show, which reads as "is this
  // still taking offers?" rather than a deliberate always-open listing. One of
  // the two must be a real decision the editor made, not both left blank.
  if (!input.applicationDeadline && !input.applicationDeadlineOngoing) {
    missing.push("publish.missing.deadline");
  }
  return missing;
}

/** Date | null -> "YYYY-MM-DD" for prefilling an <input type=date>. */
export function formatDateInput(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : "";
}

/** Release date | null -> the form value matching its saved precision (IA-42):
   "YYYY-MM-DD" for DAY (<input type=date>), "YYYY-MM" for MONTH (<input
   type=month>), "YYYY" for YEAR (a plain number input). The stored date
   already sits at that precision's placeholder (MONTH -> YYYY-MM-01, YEAR ->
   YYYY-01-01), so slicing the ISO string is enough — nothing is inferred that
   wasn't already true of the saved value. */
export function formatReleaseDateInput(d: Date | null, releasePrecision: string): string {
  if (!d) return "";
  const iso = d.toISOString();
  if (releasePrecision === "YEAR") return iso.slice(0, 4);
  if (releasePrecision === "MONTH") return iso.slice(0, 7);
  return iso.slice(0, 10);
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

// ── Trilingual offers (IA-44, 2026-08-05) ─────────────────────────────────
// Placement titles/descriptions and SponsorshipTier names/benefits are now
// per-locale. The legacy single-language columns (`title`/`description`,
// `name`/`benefits`) are kept and still feed every reader that has not been
// taught about the locale trio yet — including publishBlockers above — so they
// must never be left empty while a locale tab has text in it. Both the admin
// and the creator actions mirror them through firstFilledLocale().

export const OFFER_LANGS = ["hy", "ru", "en"] as const;
export type OfferLang = (typeof OFFER_LANGS)[number];

/** The value that goes into the legacy column: the reader's default locale
   first (the site is hy-first), then whatever else the editor did fill in.
   Returns "" only when all three tabs are empty, which is exactly the case the
   publish gate is meant to catch. */
export function firstFilledLocale(v: { hy?: string; ru?: string; en?: string }): string {
  return (v.hy || "").trim() || (v.ru || "").trim() || (v.en || "").trim() || "";
}

// The three positions Мариам asked every project to start with (IA-44 §1): one
// product-placement slot and two sponsorship packages. Prefilled in all three
// languages — the point of the request is that a creator opens the form and
// already has the standard shape of a deal in front of them, and leaving ru/en
// blank would have made them retype the same three names in two more tabs.
// Owner decision 2026-08-05: NEW projects only. Existing projects get the same
// set behind the "add the standard set" button, so nothing already published
// changes without an editor asking for it.
export const DEFAULT_PLACEMENT_SET: { hy: string; ru: string; en: string }[] = [
  { hy: "Գովազդային ինտեգրացիա", ru: "Рекламная интеграция", en: "Advertising integration" },
];

export const DEFAULT_TIER_SET: { hy: string; ru: string; en: string }[] = [
  { hy: "Գլխավոր հովանավոր", ru: "Генеральный спонсор", en: "General sponsor" },
  { hy: "Պաշտոնական հովանավոր", ru: "Официальный спонсор", en: "Official sponsor" },
];

/** Keep an uploaded-file path pointing INSIDE our own uploads root (IA-44).

   `presentationPdf` differs from the other upload fields in one way that
   matters: the project page renders it as a link the reader clicks, so a
   crafted save could otherwise park an arbitrary URL — or a traversal out of
   the uploads tree — behind a "Download presentation" button on a real
   listing. The upload endpoint already decides WHERE a file may be written;
   this decides what the form is allowed to claim was written. "" means the
   editor detached the file, and stays "". */
export function safeUploadPath(value: string): string {
  const v = value.trim();
  if (!v) return "";
  if (!v.startsWith("/uploads/")) return "";
  if (v.includes("..") || v.includes("\\")) return "";
  return v;
}
