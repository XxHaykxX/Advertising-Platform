"use server";

import { revalidatePath, updateTag } from "next/cache";
import { notFound } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/auth/require";
import { recordVersion } from "@/lib/history/record";
import { getLocale } from "@/lib/data/locale";
import { makeUI, type Locale } from "@/lib/i18n";
import { seedNames } from "@/lib/person-name";
import { notifyNewProjectForModeration } from "@/lib/mail";
import { notifyRoles } from "@/lib/data/notifications";
import {
  KIND_VALUES,
  RELEASE_PRECISION_VALUES,
  RELEASE_YEAR_MAX,
  RELEASE_YEAR_MIN,
  ROLE_VALUES,
  deriveFormatCategory,
  firstFilledLocale,
  kindForRole,
  publishBlockers,
  validateReleaseDateValue,
} from "@/app/admin/(panel)/projects/form-shared";
import { revalidateStorefront } from "@/lib/data/revalidate-storefront";
import type { ProjectFormValues, ProjectFormState } from "@/app/admin/(panel)/projects/actions";
import { safeUploadPath } from "@/lib/uploads-path";

/* #16 (expanded 2026-07-16): the Creator self-serve submission form
   (/account/projects/new) now reuses admin/(panel)/projects/project-form.tsx
   wholesale (mode="creator") instead of a second, separately maintained
   lightweight form — so buildData/validate/parseActorRows/parseTierRows
   below are a full 1:1 copy of admin/(panel)/projects/actions.ts, using its
   exported ProjectFormValues/ProjectFormState types so this action drops
   straight into ProjectForm's `action` prop. Deliberately duplicated rather
   than imported (same "different zone, different trust level" reasoning as
   the auto-code generator further down): staff-authored projects go straight
   to APPROVED, creator-authored ones never do — moderationStatus/isActive/
   ownerId are forced below and must never be reachable from the form. */

// MySQL caps a plain (non-@db.Text) Prisma String column at VarChar(191) —
// same boundary as the admin form's buildData().
const VARCHAR_MAX = 191;

function str(fd: FormData, key: string, maxLen?: number) {
  const v = String(fd.get(key) || "").trim();
  return maxLen ? v.slice(0, maxLen) : v;
}
function int(fd: FormData, key: string, fallback = 0) {
  const n = parseInt(String(fd.get(key) || ""), 10);
  return Number.isFinite(n) ? n : fallback;
}
/** Blank input -> null instead of 0, for the optional AMD money fields. */
function intOrNull(fd: FormData, key: string): number | null {
  const raw = String(fd.get(key) || "").trim();
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}
function bool(fd: FormData, key: string) {
  return fd.get(key) === "on";
}
function enumVal<T extends string>(fd: FormData, key: string, allowed: readonly T[], fallback: T): T {
  const v = String(fd.get(key) || "");
  return (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
}
function jsonArray<T>(fd: FormData, key: string): T[] {
  try {
    const a = JSON.parse(String(fd.get(key) || "[]"));
    return Array.isArray(a) ? a : [];
  } catch {
    return [];
  }
}

/** "YYYY-MM-DD" (or "") -> Date | null for a Prisma DateTime? column. */
function dateOrNull(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "YouTube, Kinodaran, TV" -> JSON string[] (or null when empty) for the
   nullable @db.Text Json column. */
function platformsToJson(csv: string): string | null {
  const arr = csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return arr.length ? JSON.stringify(arr) : null;
}

/** "url1\nurl2" or "url1, url2" -> JSON string[] (or null when empty) for the
   nullable @db.Text gallery column. Splits on newlines and commas. */
function galleryToJson(input: string): string | null {
  const arr = input
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return arr.length ? JSON.stringify(arr) : null;
}

function buildData(fd: FormData): ProjectFormValues {
  const genres = jsonArray<string>(fd, "genres");
  const kind = enumVal(fd, "kind", KIND_VALUES, "FILM");
  const titleHy = str(fd, "titleHy", VARCHAR_MAX);
  const titleRu = str(fd, "titleRu", VARCHAR_MAX);
  const titleEn = str(fd, "titleEn", VARCHAR_MAX);
  const synopsisHy = str(fd, "synopsisHy");
  const synopsisRu = str(fd, "synopsisRu");
  const synopsisEn = str(fd, "synopsisEn");
  const taglineHy = str(fd, "taglineHy", VARCHAR_MAX);
  const taglineRu = str(fd, "taglineRu", VARCHAR_MAX);
  const taglineEn = str(fd, "taglineEn", VARCHAR_MAX);
  return {
    // hy first (DEFAULT_LOCALE), then ru, then en — mirrors the admin form's
    // buildData. Ru-first made an Armenian-only rename invisible in every list
    // that renders the legacy `title` column.
    title: (titleHy || titleRu || titleEn).slice(0, VARCHAR_MAX),
    code: str(fd, "code", VARCHAR_MAX),
    genre: (genres[0] || "").slice(0, VARCHAR_MAX),
    genres,
    synopsis: synopsisHy || synopsisRu || synopsisEn,
    titleHy,
    titleRu,
    titleEn,
    synopsisHy,
    synopsisRu,
    synopsisEn,
    // Every stored file path is checked on the way in — the upload endpoint
    // decides where a file may be written, this decides what a save may claim
    // was written. See src/lib/uploads-path.ts.
    poster: safeUploadPath(str(fd, "poster", VARCHAR_MAX)),
    gallery: str(fd, "gallery"),
    presentationPdf: safeUploadPath(str(fd, "presentationPdf", VARCHAR_MAX)),
    // Derived from Type when the editor leaves it alone (2026-08-05). Format
    // is a publish blocker, but it asks the same question as the Type radio
    // right above it, so a project could sit refused over a field whose answer
    // the form already had — and the public catalog was meanwhile deriving it
    // anyway (deriveFormatCategory in projects.ts). The picker still wins when
    // it is set: only Type cannot tell a mini-series from a series, or a
    // documentary from a feature.
    formatCategory:
      str(fd, "formatCategory", VARCHAR_MAX) ||
      deriveFormatCategory("", kind, `${str(fd, "format", VARCHAR_MAX)} ${genres.join(" ")}`),
    // Studio became a MultiSelect over a dictionary (2026-07-27) — same CSV
    // storage convention as genres/countries/platforms, so a co-production can
    // list every company instead of cramming them into one text field.
    studio: jsonArray<string>(fd, "studio").join(", ").slice(0, VARCHAR_MAX),
    kind,
    episodes: kind === "SERIAL" ? intOrNull(fd, "episodes") : null,
    episodeMinutes: kind === "SERIAL" ? intOrNull(fd, "episodeMinutes") : null,
    durationMinutes: kind === "FILM" ? intOrNull(fd, "durationMinutes") : null,
    countries: jsonArray<string>(fd, "countries").join(", ").slice(0, VARCHAR_MAX),
    ageRating: str(fd, "ageRating", VARCHAR_MAX),
    productionBudgetAmd: intOrNull(fd, "productionBudgetAmd"),
    // Never trusted from the form for a Creator submission — forced to false
    // below regardless of what buildData parses here.
    isActive: bool(fd, "isActive"),
    applicationDeadline: str(fd, "applicationDeadline"),
    applicationDeadlineOngoing: bool(fd, "applicationDeadlineOngoing"),
    releaseDate: str(fd, "releaseDate"),
    releasePrecision: enumVal(fd, "releasePrecision", RELEASE_PRECISION_VALUES, "DAY"),
    platforms: jsonArray<string>(fd, "platforms").join(", ").slice(0, VARCHAR_MAX),
    tagline: taglineHy || taglineRu || taglineEn,
    taglineHy,
    taglineRu,
    taglineEn,
    references: str(fd, "references"),
    cinemas: jsonArray<string>(fd, "cinemas").join(", "),
    videoEmbedUrl: str(fd, "videoEmbedUrl", VARCHAR_MAX),
    videoFile: safeUploadPath(str(fd, "videoFile", VARCHAR_MAX)),
  };
}

function validate(data: ProjectFormValues, t: ReturnType<typeof makeUI>): string | null {
  if (!data.title) return t("account.form.errTitleRequired");
  if (data.genres.length === 0) return t("account.form.errGenreRequired");
  if (!data.synopsis) return t("account.form.errSynopsisRequired");
  // Mirrors the admin action's validate() — see its comment (review finding,
  // 2026-08-02).
  const releaseDateError = validateReleaseDateValue(data.releaseDate, data.releasePrecision);
  if (releaseDateError === "shape") return t("account.form.errReleaseDateShape");
  if (releaseDateError === "range") {
    return t("account.form.errReleaseDateRange", { min: RELEASE_YEAR_MIN, max: RELEASE_YEAR_MAX });
  }
  return null;
}

/** The CSV schema's required fields, checked at submission time. Submitting is
   this side's publication step (there is no creator-owned draft yet), so the
   same publishBlockers() list the admin form enforces applies here — a project
   that can't be published shouldn't reach a moderator either (audit 2.8: a
   project with no placement package used to sail through moderation and land
   in the catalog with nothing to buy). */
function submitGate(
  data: ProjectFormValues,
  tierRows: { name: string; benefits: string }[],
  placementsCount: number,
  // null on create (nothing to grandfather yet); the existing row's createdAt
  // on a resubmit — see PLACEMENTS_REQUIRED_FROM in form-shared.ts.
  createdAt: Date | null,
  t: ReturnType<typeof makeUI>,
): string | null {
  const missing = publishBlockers({
    studio: data.studio,
    tagline: data.tagline,
    kind: data.kind,
    episodes: data.episodes,
    episodeMinutes: data.episodeMinutes,
    durationMinutes: data.durationMinutes,
    tiers: tierRows,
    poster: data.poster,
    placementsCount,
    formatCategory: data.formatCategory,
    applicationDeadline: data.applicationDeadline,
    applicationDeadlineOngoing: data.applicationDeadlineOngoing,
    createdAt,
  });
  if (missing.length === 0) return null;
  return `${t("publish.blockedSubmit")} ${missing.map((key) => t(key)).join(", ")}.`;
}

// ── Inline cast/crew + sponsorship tiers (#20², carried over from admin) ──
const ACTOR_KIND_VALUES = ["CAST", "CREW"] as const;
type ActorInput = { name?: string; roles?: string[]; kind?: string; photo?: string; personId?: number | null };
type TierInput = {
  dbId?: number; // existing SponsorshipTier.id, absent for a newly added row
  name?: string; // legacy single-language value — see the locale trio below
  // Per-locale name/benefits (IA-44, 2026-08-05) — mirrors the admin action's
  // TierInput (see its comment for the legacy-column contract).
  nameHy?: string;
  nameRu?: string;
  nameEn?: string;
  priceAmd?: number | null; // null -> "on request" (2026-08-04), same contract as PlacementInput.priceAmd
  benefits?: string; // legacy single-language value
  benefitsHy?: string;
  benefitsRu?: string;
  benefitsEn?: string;
  image?: string;
  isExclusive?: boolean;
  availableSlots?: number | null;
  totalSlots?: number | null;
};
type PlacementInput = {
  dbId?: number; // existing Placement.id, absent for a newly added row
  title?: string; // legacy single-language value — see the locale trio below
  // Per-locale title/description (IA-44, 2026-08-05), mirrors TierInput's
  // nameHy/Ru/En + benefitsHy/Ru/En above.
  titleHy?: string;
  titleRu?: string;
  titleEn?: string;
  description?: string; // legacy single-language value
  descriptionHy?: string;
  descriptionRu?: string;
  descriptionEn?: string;
  image?: string;
  priceAmd?: number | null;
  availableSlots?: number | null;
  totalSlots?: number | null;
};
type MilestoneInput = { label?: string; date?: string; note?: string; active?: boolean };

/** IA-44 (2026-08-05): mirrors the admin action's withLegacyHyFallback (same
   "different trust zone, duplicate" reasoning as the rest of this file) — an
   old payload from before the locale tabs existed sends only the legacy
   field, treated as the hy tab whenever every tab is empty. */
function withLegacyHyFallback(hy: string, ru: string, en: string, legacy: string): string {
  return hy || (!ru && !en ? legacy.trim() : "");
}

/** "line 1\nline 2" -> JSON string[] (trimmed, blanks dropped) for the
   benefits @db.Text column. */
function benefitsToJson(input: string): string {
  const arr = (input || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  return JSON.stringify(arr);
}

/** Rows for prisma.actor.createMany (projectId added by the caller, personId
   resolved separately by resolveActorPersonIds — see below). Same shape as
   the admin action's parseActorRows (Ф3: role -> roles[]). */
function parseActorRows(fd: FormData) {
  return jsonArray<ActorInput>(fd, "actorsRows")
    .filter((r) => (r.name || "").trim())
    .map((r, i) => {
      // See admin parseActorRows: keep every role the row carries (legacy
      // free-text incl. hy/ru) — a hard ROLE_VALUES filter would wipe them.
      const roles = (Array.isArray(r.roles) ? r.roles : []).filter(
        (v): v is string => typeof v === "string" && v.trim().length > 0,
      );
      return {
        name: (r.name || "").trim(),
        role: roles[0] ?? "",
        roles: JSON.stringify(roles),
        // CAST/CREW is derived from the picked role now (the dropdown is gone
        // from the editor). Only a role from the fixed list decides it; a legacy
        // free-text role (pre-Ф3, often hy/ru like "Ռեժիսոր") keeps the kind the
        // row already carries, so an edit-save can't flip an existing CREW
        // member to CAST just because their role predates ROLE_VALUES.
        kind: roles.length && (ROLE_VALUES as readonly string[]).includes(roles[0])
          ? kindForRole(roles[0])
          : (ACTOR_KIND_VALUES as readonly string[]).includes(r.kind ?? "")
            ? r.kind!
            : "CAST",
        photo: safeUploadPath(r.photo) || null,
        sortOrder: i,
        personId: typeof r.personId === "number" ? r.personId : null,
      };
    });
}

/** Resolve each cast/crew row to a Person — FIND-ONLY, and a miss is kept as a
   project-local row rather than dropped.

   History: staff are find-only ("cast can only be attached from the /admin/cast
   directory", 2026-07-25) because they can open that directory. A creator
   can't, and until 2026-07-26 their unmatched rows were silently dropped
   (audit 1.3). The fix back then was find-or-CREATE — which quietly handed
   every creator write access to a directory shared by the whole platform,
   headshot included, with duplicate names to be cleaned up by hand.

   Owner's decision 2026-08-07: a person the creator typed lives in their
   project only. The Actor row keeps its own name/photo snapshot with
   personId = null, brands see it on the listing exactly as before, and staff
   decide during moderation whether it deserves a directory entry.

   A row that DOES match an existing entry still gets linked — and the
   directory then owns its spelling and headshot (see snapshotPersonNames),
   which is what makes "creators can't edit directory people" true on the
   server and not just in the editor UI. */
type ResolvedActorRow = ReturnType<typeof parseActorRows>[number] & {
  personId: number | null;
  nameHy: string;
  nameRu: string;
  nameEn: string;
};

async function resolveActorPersonIds(
  tx: Prisma.TransactionClient,
  rows: ReturnType<typeof parseActorRows>,
  /** The language the creator filled the form in — a name they typed is stored
   *  as that locale's spelling (2026-07-27). Staff can add the other two later
   *  in /admin/cast; until then pickPersonName falls back. */
  locale: Locale,
): Promise<ResolvedActorRow[]> {
  const resolved: (ReturnType<typeof parseActorRows>[number] & { personId: number | null })[] = [];
  for (const r of rows) {
    if (r.personId != null) {
      resolved.push({ ...r, personId: r.personId });
      continue;
    }
    // Match on ANY spelling: the form sends the name in the language it was
    // showing, which is no longer necessarily the base column.
    const existing = await tx.person.findFirst({
      where: {
        OR: [{ name: r.name }, { nameHy: r.name }, { nameRu: r.name }, { nameEn: r.name }],
      },
      select: { id: true },
    });
    resolved.push({ ...r, personId: existing?.id ?? null });
  }
  return snapshotPersonNames(tx, resolved, locale);
}

/** Mirror of the admin action's snapshotPersonNames: the directory owns the
 *  spellings AND the headshot, the Actor row is a snapshot refreshed on every
 *  save. The form only carries one name (the locale it was shown in), so it
 *  must not be trusted for the name columns.
 *
 *  Unlinked rows (personId === null) have no directory entry to read, so they
 *  keep what the creator typed — seeded into the locale column matching the
 *  language the form was in, the same way a directory entry would have been.
 *  Without that seeding pickPersonName would fall through to the legacy base
 *  column on every locale, which is a fallback, not a spelling. */
async function snapshotPersonNames(
  tx: Prisma.TransactionClient,
  rows: (ReturnType<typeof parseActorRows>[number] & { personId: number | null })[],
  locale: Locale,
): Promise<ResolvedActorRow[]> {
  if (rows.length === 0) return [];
  const linkedIds = [...new Set(rows.map((r) => r.personId).filter((id): id is number => id != null))];
  const persons = linkedIds.length
    ? await tx.person.findMany({
        where: { id: { in: linkedIds } },
        select: { id: true, name: true, nameHy: true, nameRu: true, nameEn: true, photo: true },
      })
    : [];
  const byId = new Map(persons.map((p) => [p.id, p]));
  return rows.map((r) => {
    const p = r.personId == null ? undefined : byId.get(r.personId);
    if (!p) {
      return { ...r, ...seedNames(r.name, locale) };
    }
    return {
      ...r,
      name: p.name || r.name,
      nameHy: p.nameHy ?? "",
      nameRu: p.nameRu ?? "",
      nameEn: p.nameEn ?? "",
      // The directory's headshot wins over whatever the form posted: a creator
      // must not be able to repoint a shared person's photo at their own upload.
      photo: p.photo ?? null,
    };
  });
}

/** Rows for prisma.sponsorshipTier.createMany (projectId added by the
   caller). Price is optional (null -> "on request", 2026-08-04), same
   contract as parsePlacementRows below.

   IA-44 (2026-08-05): mirrors the admin action's parseTierRows (see its
   comment) — per-locale name/benefits, and the filter now keeps a row alive
   on ANY filled locale (or the pre-tabs legacy field), not just legacy `name`. */
function parseTierRows(fd: FormData) {
  return jsonArray<TierInput>(fd, "tiersRows")
    .filter(
      (r) =>
        (r.nameHy || "").trim() ||
        (r.nameRu || "").trim() ||
        (r.nameEn || "").trim() ||
        (r.name || "").trim(),
    )
    .map((r, i) => {
      const nameHy = withLegacyHyFallback(
        (r.nameHy || "").trim(),
        (r.nameRu || "").trim(),
        (r.nameEn || "").trim(),
        r.name || "",
      ).slice(0, VARCHAR_MAX);
      const nameRu = (r.nameRu || "").trim().slice(0, VARCHAR_MAX);
      const nameEn = (r.nameEn || "").trim().slice(0, VARCHAR_MAX);
      const benefitsHyRaw = withLegacyHyFallback(r.benefitsHy || "", r.benefitsRu || "", r.benefitsEn || "", r.benefits || "");
      const benefitsRuRaw = r.benefitsRu || "";
      const benefitsEnRaw = r.benefitsEn || "";
      return {
        dbId: typeof r.dbId === "number" ? r.dbId : null,
        // Legacy single-language column — never empty while a tab has text
        // (see the admin action's parseTierRows comment).
        name: firstFilledLocale({ hy: nameHy, ru: nameRu, en: nameEn }).slice(0, VARCHAR_MAX),
        nameHy,
        nameRu,
        nameEn,
        priceAmd: r.priceAmd == null ? null : Math.max(0, Number(r.priceAmd) || 0),
        benefits: benefitsToJson(firstFilledLocale({ hy: benefitsHyRaw, ru: benefitsRuRaw, en: benefitsEnRaw })),
        benefitsHy: benefitsHyRaw.trim() ? benefitsToJson(benefitsHyRaw) : null,
        benefitsRu: benefitsRuRaw.trim() ? benefitsToJson(benefitsRuRaw) : null,
        benefitsEn: benefitsEnRaw.trim() ? benefitsToJson(benefitsEnRaw) : null,
        image: safeUploadPath(r.image) || null,
        isExclusive: !!r.isExclusive,
        availableSlots: r.availableSlots == null ? null : Math.max(0, Number(r.availableSlots) || 0),
        totalSlots: r.totalSlots == null ? null : Math.max(0, Number(r.totalSlots) || 0),
        sortOrder: i,
      };
    });
}

/** Persist a project's tier rows inside an open transaction. Deliberately not
   delete-all-then-insert: a SponsorshipTier is referenced by brand
   applications (Interest.tierId) and holds the slot bookkeeping, so wiping and
   re-inserting detached every application from its package and reset reserved
   slots. Mirrors saveTierRows in admin/(panel)/projects/actions.ts (duplicated
   for the same zone/trust-boundary reason as the rest of this file). */
async function saveTierRows(
  tx: Prisma.TransactionClient,
  projectId: number,
  rows: ReturnType<typeof parseTierRows>,
) {
  const keptIds = rows.map((r) => r.dbId).filter((id): id is number => id != null);
  await tx.sponsorshipTier.deleteMany({
    where: { projectId, ...(keptIds.length ? { id: { notIn: keptIds } } : {}) },
  });
  for (const row of rows) {
    const { dbId, ...data } = row;
    if (dbId != null) {
      // Scoped by projectId too — a crafted payload must not reach another
      // project's package.
      await tx.sponsorshipTier.updateMany({ where: { id: dbId, projectId }, data });
    } else {
      await tx.sponsorshipTier.create({ data: { ...data, projectId } });
    }
  }
}

/** Rows for prisma.placement (projectId added by the caller). Price is
   optional (null -> "on request"), same as a tier's priceAmd since
   2026-08-04. Deliberately duplicated from admin/(panel)/projects/actions.ts,
   same trust-boundary reason as parseTierRows/saveTierRows above.

   IA-44 (2026-08-05): mirrors the admin action's parsePlacementRows — see its
   comment for the per-locale/filter-fix/legacy-fallback reasoning. */
function parsePlacementRows(fd: FormData) {
  return jsonArray<PlacementInput>(fd, "placementsRows")
    .filter(
      (r) =>
        (r.titleHy || "").trim() ||
        (r.titleRu || "").trim() ||
        (r.titleEn || "").trim() ||
        (r.title || "").trim(),
    )
    .map((r, i) => {
      const titleHy = withLegacyHyFallback(
        (r.titleHy || "").trim(),
        (r.titleRu || "").trim(),
        (r.titleEn || "").trim(),
        r.title || "",
      ).slice(0, VARCHAR_MAX);
      const titleRu = (r.titleRu || "").trim().slice(0, VARCHAR_MAX);
      const titleEn = (r.titleEn || "").trim().slice(0, VARCHAR_MAX);
      const descriptionHyRaw = withLegacyHyFallback(
        r.descriptionHy || "",
        r.descriptionRu || "",
        r.descriptionEn || "",
        r.description || "",
      );
      const descriptionRuRaw = r.descriptionRu || "";
      const descriptionEnRaw = r.descriptionEn || "";
      return {
        dbId: typeof r.dbId === "number" ? r.dbId : null,
        // Legacy single-language column — never empty while a tab has text
        // (see the admin action's parsePlacementRows comment).
        title: firstFilledLocale({ hy: titleHy, ru: titleRu, en: titleEn }).slice(0, VARCHAR_MAX),
        titleHy,
        titleRu,
        titleEn,
        description: benefitsToJson(
          firstFilledLocale({ hy: descriptionHyRaw, ru: descriptionRuRaw, en: descriptionEnRaw }),
        ),
        descriptionHy: descriptionHyRaw.trim() ? benefitsToJson(descriptionHyRaw) : null,
        descriptionRu: descriptionRuRaw.trim() ? benefitsToJson(descriptionRuRaw) : null,
        descriptionEn: descriptionEnRaw.trim() ? benefitsToJson(descriptionEnRaw) : null,
        image: safeUploadPath(r.image) || null,
        priceAmd: r.priceAmd == null ? null : Math.max(0, Number(r.priceAmd) || 0),
        availableSlots: r.availableSlots == null ? null : Math.max(0, Number(r.availableSlots) || 0),
        totalSlots: r.totalSlots == null ? null : Math.max(0, Number(r.totalSlots) || 0),
        sortOrder: i,
      };
    });
}

/** Persist a project's placement rows inside an open transaction. Same
   update-in-place-by-id shape as saveTierRows — see that function for why. */
async function savePlacementRows(
  tx: Prisma.TransactionClient,
  projectId: number,
  rows: ReturnType<typeof parsePlacementRows>,
) {
  const keptIds = rows.map((r) => r.dbId).filter((id): id is number => id != null);
  await tx.placement.deleteMany({
    where: { projectId, ...(keptIds.length ? { id: { notIn: keptIds } } : {}) },
  });
  for (const row of rows) {
    const { dbId, ...data } = row;
    if (dbId != null) {
      // Scoped by projectId too — a crafted payload must not reach another
      // project's placement.
      await tx.placement.updateMany({ where: { id: dbId, projectId }, data });
    } else {
      await tx.placement.create({ data: { ...data, projectId } });
    }
  }
}

/** Rows for prisma.productionMilestone.createMany (projectId added by the
   caller). Same shape as the admin action's parseMilestoneRows (deliberately
   duplicated, same trust-boundary reason as the rest of this file): blank-label
   rows are dropped, array order -> sortOrder, and only the first `active` row
   is kept marked. */
function parseMilestoneRows(fd: FormData) {
  let activeSeen = false;
  return jsonArray<MilestoneInput>(fd, "milestonesRows")
    .filter((r) => (r.label || "").trim())
    .map((r, i) => {
      const active = !!r.active && !activeSeen;
      if (active) activeSeen = true;
      return {
        label: (r.label || "").trim().slice(0, VARCHAR_MAX),
        date: dateOrNull((r.date || "").trim()),
        note: (r.note || "").trim().slice(0, VARCHAR_MAX),
        isActive: active,
        sortOrder: i,
      };
    });
}

// ── Auto Code generation (#PP-YYYY-NNNN) ───────────────────────────────────
// Deliberately duplicated from admin/(panel)/projects/actions.ts rather than
// imported — that module is a different zone/trust boundary for this task.
// Uniqueness is still enforced by the DB's @unique constraint; createCreatorProject
// below retries with a freshly generated code on a P2002 race.
function nextProjectCode(usedCodes: string[], year: number): string {
  const prefix = `#PP-${year}-`;
  let maxSeq = 0;
  for (const code of usedCodes) {
    const m = code.match(/^#PP-\d{4}-(\d+)$/);
    if (m) maxSeq = Math.max(maxSeq, parseInt(m[1], 10));
  }
  return `${prefix}${String(maxSeq + 1).padStart(4, "0")}`;
}

async function generateProjectCode(): Promise<string> {
  const year = new Date().getFullYear();
  const rows = await prisma.project.findMany({
    where: { code: { startsWith: `#PP-${year}-` } },
    select: { code: true },
  });
  return nextProjectCode(rows.map((r) => r.code), year);
}

export async function createCreatorProject(
  _prev: ProjectFormState,
  fd: FormData,
): Promise<ProjectFormState> {
  const user = await requireMember();
  const locale = await getLocale();
  const t = makeUI(locale);

  // Defense in depth: the "Submit project" entry points are hidden from
  // BRAND accounts (see account/page.tsx + account/projects/page.tsx), but a
  // direct POST must still be rejected rather than silently creating a
  // project owned by a brand.
  if (user.role !== "CREATOR") {
    return { error: t("account.form.errRequired") };
  }

  const data = buildData(fd);
  const error = validate(data, t);
  if (error) return { error, values: data };

  // NB: no dictionary writes here. Until 2026-08-07 this side pushed every
  // custom platform / country / studio into the global dictionaries, so one
  // creator's spelling became a permanent option for everyone. Those values
  // still survive — they live on this project's own free-text columns and
  // render as chips wherever the project does, exactly like `cinemas`, which
  // never had a dictionary. Staff promote one during moderation if it's worth
  // promoting (see mayEditDictionary in src/lib/actions/studios.ts).

  // Same auto-code retry loop as admin createProject — the form never
  // submits a code (readonly/hidden in create mode), so this always runs.
  const autoCode = !data.code;
  const maxAttempts = autoCode ? 5 : 1;
  const actorRows = parseActorRows(fd);
  const tierRows = parseTierRows(fd);
  const placementRows = parsePlacementRows(fd);
  const milestoneRows = parseMilestoneRows(fd);

  // A brand-new project has no "before" to grandfather against — see
  // PLACEMENTS_REQUIRED_FROM.
  const blocked = submitGate(data, tierRows, placementRows.length, null, t);
  if (blocked) return { error: blocked, values: data };

  const projectData = {
    ...data,
    genres: data.genres.length ? JSON.stringify(data.genres) : null,
    synopsisHy: data.synopsisHy || null,
    synopsisRu: data.synopsisRu || null,
    synopsisEn: data.synopsisEn || null,
    poster: data.poster || null,
    gallery: galleryToJson(data.gallery),
    presentationPdf: data.presentationPdf || null,
    // Defense in depth: the form never renders the date input while Ongoing
    // is checked, but a save must not trust that alone — force the pair back
    // into agreement here too.
    applicationDeadline: data.applicationDeadlineOngoing ? null : dateOrNull(data.applicationDeadline),
    releaseDate: dateOrNull(data.releaseDate),
    platforms: platformsToJson(data.platforms),
    tagline: data.tagline || null,
    taglineHy: data.taglineHy || null,
    taglineRu: data.taglineRu || null,
    taglineEn: data.taglineEn || null,
    references: data.references || null,
    cinemas: data.cinemas || null,
    videoEmbedUrl: data.videoEmbedUrl || null,
    videoFile: data.videoFile || null,
    // ── Never trusted from the form — forced server-side ──
    // ownerId is always the submitting member.
    ownerId: user.id,
    // Last editor — same user on create, kept in step on every later save.
    updatedById: user.id,
    // Creator submissions always start PENDING + inactive: they only reach
    // the public catalog once a moderator approves them in
    // /admin/moderation (unlike staff-authored projects in
    // admin/(panel)/projects/actions.ts, which go straight to APPROVED).
    moderationStatus: "PENDING" as const,
    isActive: false,
  };

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const code = autoCode ? await generateProjectCode() : data.code;
    try {
      const created = await prisma.$transaction(async (tx) => {
        const project = await tx.project.create({ data: { ...projectData, code } });
        if (actorRows.length) {
          const resolvedActors = await resolveActorPersonIds(tx, actorRows, locale);
          await tx.actor.createMany({
            data: resolvedActors.map((r) => ({ ...r, projectId: project.id })),
          });
        }
        if (tierRows.length) {
          // dbId is a form-only marker (see saveTierRows) — never a column.
          await tx.sponsorshipTier.createMany({
            data: tierRows.map(({ dbId: _dbId, ...r }) => ({ ...r, projectId: project.id })),
          });
        }
        if (placementRows.length) {
          // dbId is a form-only marker (see savePlacementRows) — never a column.
          await tx.placement.createMany({
            data: placementRows.map(({ dbId: _dbId, ...r }) => ({ ...r, projectId: project.id })),
          });
        }
        if (milestoneRows.length) {
          await tx.productionMilestone.createMany({
            data: milestoneRows.map((r) => ({ ...r, projectId: project.id })),
          });
        }
        // After cast/tiers/placements/milestones have landed, so the snapshot
        // captures the full aggregate the moderator will see, not just the
        // bare row.
        await recordVersion(tx, "Project", project.id, "CREATE", { id: user.id, name: user.name });
        return project;
      }, { timeout: 15000 });

      // #22: notify the moderation team by email. Fire-and-forget / non-blocking
      // so a mail outage never breaks a creator's submission.
      notifyNewProjectForModeration({ id: created.id, title: created.title }).catch(() => {});

      // In-app notification for the moderation team (#25 / V9), same audience
      // as the email above. Non-blocking failure (notifyRoles swallows).
      await notifyRoles(["SUPERADMIN", "MODERATOR"], {
        type: "PROJECT_SUBMITTED",
        data: { projectId: created.id, projectTitle: created.title, creatorName: user.name },
        link: "/admin/moderation",
      });

      updateTag("projects");
      revalidatePath("/account/projects");
      revalidatePath("/admin/moderation");
      revalidateStorefront();
      return { ok: true, redirect: "/account/projects" };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        if (autoCode && attempt < maxAttempts) continue; // regenerate + retry
        return { error: t("account.form.errCode"), values: data };
      }
      throw e;
    }
  }
  return { error: t("account.form.errCode"), values: data };
}

/** Edit a Creator's OWN project (audit 2.4 / owner decision C.6). Until this
   existed, the only creator-owned mutation was create — a REJECTED project was
   a dead end, even though the rejection email tells the creator to "edit and
   resubmit". Any save here re-enters moderation (PENDING + inactive), which is
   what makes a resubmission a resubmission.

   APPROVED projects are refused outright as of 2026-08-07 (owner decision).
   They used to be editable, and the edit pulled the listing out of the catalog
   until a moderator re-checked it (C.6) — so a typo fix took a live project
   offline. Those edits go through staff now. Modeled
   on admin's updateProject (same notFound-for-both-"missing"-and-"not yours"
   pattern) but reuses this file's create-side helpers (buildData/validate/
   submitGate/parseActorRows/parseTierRows/resolveActorPersonIds) rather than
   the admin action's, for the same "different trust zone" reasons documented
   on createCreatorProject above. */
export async function updateCreatorProject(
  id: number,
  _prev: ProjectFormState,
  fd: FormData,
): Promise<ProjectFormState> {
  const user = await requireMember();
  const locale = await getLocale();
  const t = makeUI(locale);

  if (user.role !== "CREATOR") {
    return { error: t("account.form.errRequired") };
  }

  // 404 for both "doesn't exist" and "not yours" — a Creator must not be able
  // to distinguish the two (same reasoning as admin's updateProject).
  // createdAt feeds submitGate's placements grandfather clause below.
  const existing = await prisma.project.findUnique({
    where: { id },
    select: { ownerId: true, createdAt: true, code: true, moderationStatus: true },
  });
  if (!existing) notFound();
  if (existing.ownerId !== user.id) notFound();
  // A published project is out of the creator's hands (owner decision
  // 2026-08-07): it is live in the catalog, brands are reading it, and an edit
  // used to pull it back out until a moderator re-checked it. The edit page
  // renders read-only for these, so reaching this is either a stale tab or a
  // hand-made POST — an error is the honest answer to both.
  if (existing.moderationStatus === "APPROVED") {
    return { error: t("account.form.errApproved") };
  }

  const data = buildData(fd);
  const error = validate(data, t);
  if (error) return { error, values: data };

  // No dictionary writes on this side either — see createCreatorProject above.

  const actorRows = parseActorRows(fd);
  const tierRows = parseTierRows(fd);
  const placementRows = parsePlacementRows(fd);
  const milestoneRows = parseMilestoneRows(fd);

  const blocked = submitGate(data, tierRows, placementRows.length, existing.createdAt, t);
  if (blocked) return { error: blocked, values: data };

  try {
    // #20²: update the project and fully replace its cast/crew + tiers + the
    // production timeline in one transaction (delete-all then re-insert, same
    // as admin's updateProject). The Production Timeline section was opened
    // to creators on 2026-08-04 (owner request), so milestonesRows is now
    // submitted from this side too.
    await prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id },
        data: {
          ...data,
          genres: data.genres.length ? JSON.stringify(data.genres) : null,
          synopsisHy: data.synopsisHy || null,
          synopsisRu: data.synopsisRu || null,
          synopsisEn: data.synopsisEn || null,
          poster: data.poster || null,
          gallery: galleryToJson(data.gallery),
          presentationPdf: data.presentationPdf || null,
          // Defense in depth: the form never renders the date input while
          // Ongoing is checked, but a save must not trust that alone — force
          // the pair back into agreement here too.
          applicationDeadline: data.applicationDeadlineOngoing ? null : dateOrNull(data.applicationDeadline),
          releaseDate: dateOrNull(data.releaseDate),
          platforms: platformsToJson(data.platforms),
          tagline: data.tagline || null,
          taglineHy: data.taglineHy || null,
          taglineRu: data.taglineRu || null,
          taglineEn: data.taglineEn || null,
          references: data.references || null,
          cinemas: data.cinemas || null,
          videoEmbedUrl: data.videoEmbedUrl || null,
          videoFile: data.videoFile || null,
          // ── Never trusted from the form — forced server-side ──
          // `code` is the public #PP-… identifier. It reaches the form as a
          // hidden readonly mirror, and `...data` above carries whatever came
          // back — so a hand-crafted POST could rename someone's project to any
          // free code. Re-assert the stored one. (ownerId is never in `data`.)
          code: existing.code,
          // Back to moderation on every save. Only DRAFT/PENDING/REJECTED rows
          // reach this line (APPROVED is refused above), so this is either a
          // resubmission after a rejection or another pass at something not yet
          // published — and a stale rejectionReason no longer applies to either.
          moderationStatus: "PENDING",
          isActive: false,
          rejectionReason: null,
          // Last editor, kept in step on every save (not just create).
          updatedById: user.id,
        },
      });
      await tx.actor.deleteMany({ where: { projectId: id } });
      if (actorRows.length) {
        const resolvedActors = await resolveActorPersonIds(tx, actorRows, locale);
        await tx.actor.createMany({ data: resolvedActors.map((r) => ({ ...r, projectId: id })) });
      }
      await saveTierRows(tx, id, tierRows);
      await savePlacementRows(tx, id, placementRows);
      await tx.productionMilestone.deleteMany({ where: { projectId: id } });
      if (milestoneRows.length) {
        await tx.productionMilestone.createMany({ data: milestoneRows.map((r) => ({ ...r, projectId: id })) });
      }
      // After the full replace, so the snapshot reflects the saved aggregate.
      await recordVersion(tx, "Project", id, "UPDATE", { id: user.id, name: user.name });
    }, { timeout: 15000 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: t("account.form.errCode"), values: data };
    }
    throw e;
  }

  // Same moderation-team notifications as a fresh submission (#22/#25) —
  // a resubmitted/edited project needs a moderator's attention again, just
  // like a brand-new one.
  notifyNewProjectForModeration({ id, title: data.title }).catch(() => {});
  await notifyRoles(["SUPERADMIN", "MODERATOR"], {
    type: "PROJECT_SUBMITTED",
    data: { projectId: id, projectTitle: data.title, creatorName: user.name },
    link: "/admin/moderation",
  });

  updateTag("projects");
  revalidatePath("/account/projects");
  revalidatePath("/admin/moderation");
  revalidateStorefront();
  return { ok: true, redirect: "/account/projects" };
}
