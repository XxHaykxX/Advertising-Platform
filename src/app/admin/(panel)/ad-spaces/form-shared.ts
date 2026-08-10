/* Shape and parsing of the ad-space form — shared by the staff section
   (/admin/ad-spaces) and the creator cabinet (/account/ad-spaces).

   Deliberately ONE module, not the copy-per-zone the project form carries
   (see the note on top of account/projects/actions.ts): what actually differs
   between the two zones is who owns the row and who may set its status, and
   that stays in each action. Everything here is trust-free — it reads a
   FormData and returns plain values; nothing in this file decides ownership,
   moderationStatus or isActive.

   No "use server" and no server-only import: the form component imports the
   types and EMPTY_* from here, so this module has to stay bundlable. */

import { normalizeAdSpaceChannel } from "@/lib/ad-channels";
import { safeUploadPath } from "@/lib/uploads-path";
import { firstFilledLocale } from "@/app/admin/(panel)/projects/form-shared";

// MySQL caps a plain (non-@db.Text) Prisma String column at VarChar(191) —
// same boundary the project actions truncate at.
const VARCHAR_MAX = 191;

/** One row of "what a brand buys on this space" — the AdSpaceOffer counterpart
 *  of PlacementRow. `dbId` is carried so a save updates the row in place
 *  instead of delete+reinsert (see saveTierRows in the project actions for why
 *  that matters once applications point at these rows). */
export type AdSpaceOfferRow = {
  dbId?: number;
  nameHy: string;
  nameRu: string;
  nameEn: string;
  /** What period the price buys ("месяц", "неделя") — free text per locale,
   *  same reason as sizeFormat: the unit differs in every channel. */
  periodHy: string;
  periodRu: string;
  periodEn: string;
  priceAmd: number | null; // null -> "on request"
  availableSlots: number | null;
  totalSlots: number | null;
};

export const EMPTY_AD_SPACE_OFFER: AdSpaceOfferRow = {
  nameHy: "",
  nameRu: "",
  nameEn: "",
  periodHy: "",
  periodRu: "",
  periodEn: "",
  priceAmd: null,
  availableSlots: null,
  totalSlots: null,
};

export type AdSpaceFormValues = {
  /** The public #AS-… identifier. Reaches the form as a readonly mirror and is
   *  never trusted back on update — the actions re-assert the stored one. */
  code: string;
  channel: string;
  titleHy: string;
  titleRu: string;
  titleEn: string;
  /** Newline-separated in the UI, JSON string[] at rest — same convention as a
   *  placement's description. */
  descriptionHy: string;
  descriptionRu: string;
  descriptionEn: string;
  city: string;
  address: string;
  sizeFormat: string;
  reachPerDay: number | null;
  sides: number | null;
  availableFrom: string; // "YYYY-MM-DD" or ""
  availableTo: string;
  image: string;
  gallery: string; // newline-separated "/uploads/…" paths
  /** Staff-only. A creator's save forces this false server-side. */
  isActive: boolean;
};

export const EMPTY_AD_SPACE: AdSpaceFormValues = {
  code: "",
  channel: "",
  titleHy: "",
  titleRu: "",
  titleEn: "",
  descriptionHy: "",
  descriptionRu: "",
  descriptionEn: "",
  city: "",
  address: "",
  sizeFormat: "",
  reachPerDay: null,
  sides: null,
  availableFrom: "",
  availableTo: "",
  image: "",
  gallery: "",
  isActive: true,
};

export type AdSpaceFormState = {
  error?: string;
  values?: AdSpaceFormValues;
  // Success is reported, never acted on here: an action must not call
  // redirect() (ChunkLoadError on prod — see partners/actions.ts). The form
  // navigates on this signal.
  ok?: boolean;
  redirect?: string;
};

/** Just enough of makeUI/useUI to look a message up. Taking the translator as
 *  a parameter is what keeps this module free of the server-only i18n import. */
type Translate = (key: string, vars?: Record<string, string | number>) => string;

function str(fd: FormData, key: string, maxLen?: number) {
  const v = String(fd.get(key) || "").trim();
  return maxLen ? v.slice(0, maxLen) : v;
}

function intOrNull(fd: FormData, key: string): number | null {
  const raw = String(fd.get(key) || "").trim();
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? Math.max(0, n) : null;
}

function jsonArray<T>(fd: FormData, key: string): T[] {
  try {
    const a = JSON.parse(String(fd.get(key) || "[]"));
    return Array.isArray(a) ? a : [];
  } catch {
    return [];
  }
}

export function buildAdSpaceData(fd: FormData): AdSpaceFormValues {
  return {
    code: str(fd, "code", VARCHAR_MAX),
    channel: str(fd, "channel", 32),
    titleHy: str(fd, "titleHy", VARCHAR_MAX),
    titleRu: str(fd, "titleRu", VARCHAR_MAX),
    titleEn: str(fd, "titleEn", VARCHAR_MAX),
    descriptionHy: str(fd, "descriptionHy"),
    descriptionRu: str(fd, "descriptionRu"),
    descriptionEn: str(fd, "descriptionEn"),
    city: str(fd, "city", VARCHAR_MAX),
    address: str(fd, "address", VARCHAR_MAX),
    sizeFormat: str(fd, "sizeFormat", VARCHAR_MAX),
    reachPerDay: intOrNull(fd, "reachPerDay"),
    sides: intOrNull(fd, "sides"),
    availableFrom: str(fd, "availableFrom"),
    availableTo: str(fd, "availableTo"),
    // The upload endpoint decides where a file may be written; this decides
    // what a save may claim was written (see src/lib/uploads-path.ts).
    image: safeUploadPath(str(fd, "image", VARCHAR_MAX)),
    gallery: str(fd, "gallery"),
    isActive: fd.get("isActive") === "on",
  };
}

export function parseAdSpaceOfferRows(fd: FormData): AdSpaceOfferRow[] {
  return jsonArray<Partial<AdSpaceOfferRow>>(fd, "offersRows")
    .filter((r) => (r.nameHy || "").trim() || (r.nameRu || "").trim() || (r.nameEn || "").trim())
    .map((r) => ({
      dbId: typeof r.dbId === "number" ? r.dbId : undefined,
      nameHy: (r.nameHy || "").trim().slice(0, VARCHAR_MAX),
      nameRu: (r.nameRu || "").trim().slice(0, VARCHAR_MAX),
      nameEn: (r.nameEn || "").trim().slice(0, VARCHAR_MAX),
      periodHy: (r.periodHy || "").trim().slice(0, VARCHAR_MAX),
      periodRu: (r.periodRu || "").trim().slice(0, VARCHAR_MAX),
      periodEn: (r.periodEn || "").trim().slice(0, VARCHAR_MAX),
      priceAmd: r.priceAmd == null ? null : Math.max(0, Number(r.priceAmd) || 0),
      availableSlots: r.availableSlots == null ? null : Math.max(0, Number(r.availableSlots) || 0),
      totalSlots: r.totalSlots == null ? null : Math.max(0, Number(r.totalSlots) || 0),
    }));
}

/** The legacy single-language column every localized field still carries — see
 *  pickLocale's `base` argument. Never empty while any tab has text. */
export function adSpaceLegacyTitle(data: AdSpaceFormValues): string {
  return firstFilledLocale({ hy: data.titleHy, ru: data.titleRu, en: data.titleEn }).slice(0, VARCHAR_MAX);
}

export function adSpaceLegacyOfferName(row: AdSpaceOfferRow): string {
  return firstFilledLocale({ hy: row.nameHy, ru: row.nameRu, en: row.nameEn }).slice(0, VARCHAR_MAX);
}

/** "line 1\nline 2" -> JSON string[] (trimmed, blanks dropped), the storage
 *  shape of every bullet list in this codebase. */
export function bulletsToJson(input: string): string {
  return JSON.stringify(
    (input || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

/** "path\npath" (what ImageUploader submits) -> JSON string[] or null. */
export function galleryToJson(input: string): string | null {
  const arr = (input || "")
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(safeUploadPath)
    .filter(Boolean);
  return arr.length ? JSON.stringify(arr) : null;
}

/** "YYYY-MM-DD" (or "") -> Date | null for a Prisma DateTime? column. */
export function dateOrNull(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Next free "#AS-YYYY-NNNN" — the AdSpace counterpart of nextProjectCode, one
 * past the highest sequence already used this year. Pure so it can be tested
 * without a database; the DB's @unique constraint is still what enforces
 * uniqueness, and the callers retry on a P2002 race.
 */
export function nextAdSpaceCode(usedCodes: string[], year: number): string {
  let maxSeq = 0;
  for (const code of usedCodes) {
    const m = code.match(/^#AS-\d{4}-(\d+)$/);
    if (m) maxSeq = Math.max(maxSeq, parseInt(m[1], 10));
  }
  return `#AS-${year}-${String(maxSeq + 1).padStart(4, "0")}`;
}

/** Field-level validation — what has to be true of ANY save, draft included. */
export function validateAdSpace(data: AdSpaceFormValues, t: Translate): string | null {
  if (!normalizeAdSpaceChannel(data.channel)) return t("adSpaceForm.errChannelRequired");
  if (!adSpaceLegacyTitle(data)) return t("adSpaceForm.errTitleRequired");
  if (data.availableFrom && data.availableTo && data.availableFrom > data.availableTo) {
    return t("adSpaceForm.errDateOrder");
  }
  return null;
}

/**
 * What has to be true before a space is PUBLIC — one predicate, three call
 * sites (staff save with isActive on, creator submit, moderator approval), so
 * the three can't drift apart the way a page gate and an action check did in
 * August (see permissions notes in the repo docs).
 *
 * Returns dictionary keys, rendered by the caller in its own locale. Takes the
 * narrowest shape it needs, so the moderator's call site can pass a database
 * row and the form's call site its parsed values.
 */
export function adSpacePublishBlockers(data: { sizeFormat: string }, offersCount: number): string[] {
  const missing: string[] = [];
  // A space nobody can buy anything on is the ad-space version of audit 2.8 —
  // a listing that reaches the storefront with no offer attached.
  if (offersCount === 0) missing.push("adSpace.publish.offers");
  if (!data.sizeFormat) missing.push("adSpace.publish.sizeFormat");
  return missing;
}
