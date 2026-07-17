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
