/* Pure, sync helpers + constants shared between the project server actions and
   the client form. Kept out of actions.ts because a "use server" module may
   only export async functions. */

export const PLACEMENT_TYPE_VALUES = ["In-Frame", "Story Integration", "Mention"] as const;

export const KIND_VALUES = ["FILM", "SERIAL"] as const;

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
