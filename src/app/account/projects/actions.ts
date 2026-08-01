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
import { addStreamingSources } from "@/lib/actions/streaming-sources";
import { addCountries } from "@/lib/actions/countries";
import { addStudios } from "@/lib/actions/studios";
import {
  KIND_VALUES,
  RELEASE_PRECISION_VALUES,
  RELEASE_YEAR_MAX,
  RELEASE_YEAR_MIN,
  ROLE_VALUES,
  kindForRole,
  parseCsvInput,
  publishBlockers,
  validateReleaseDateValue,
} from "@/app/admin/(panel)/projects/form-shared";
import type { ProjectFormValues, ProjectFormState } from "@/app/admin/(panel)/projects/actions";

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
    poster: str(fd, "poster", VARCHAR_MAX),
    gallery: str(fd, "gallery"),
    formatCategory: str(fd, "formatCategory", VARCHAR_MAX),
    // Language is now a MultiSelect (admin redesign phase 1) — same CSV
    // storage convention as genres/countries/platforms/cinemas.
    language: jsonArray<string>(fd, "language").join(", ").slice(0, VARCHAR_MAX),
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
    videoFile: str(fd, "videoFile", VARCHAR_MAX),
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
  });
  if (missing.length === 0) return null;
  return `${t("publish.blockedSubmit")} ${missing.map((key) => t(key)).join(", ")}.`;
}

// ── Inline cast/crew + sponsorship tiers (#20², carried over from admin) ──
const ACTOR_KIND_VALUES = ["CAST", "CREW"] as const;
type ActorInput = { name?: string; roles?: string[]; kind?: string; photo?: string; personId?: number | null };
type TierInput = {
  dbId?: number; // existing SponsorshipTier.id, absent for a newly added row
  name?: string;
  priceAmd?: number;
  benefits?: string;
  image?: string;
  isExclusive?: boolean;
  availableSlots?: number | null;
  totalSlots?: number | null;
};
type PlacementInput = {
  dbId?: number; // existing Placement.id, absent for a newly added row
  title?: string;
  description?: string;
  image?: string;
  priceAmd?: number | null;
  availableSlots?: number | null;
  totalSlots?: number | null;
};

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
        photo: (r.photo || "").trim() || null,
        sortOrder: i,
        personId: typeof r.personId === "number" ? r.personId : null,
      };
    });
}

/** Resolve each cast/crew row to a Person — FIND-OR-CREATE on this side, unlike
   the admin action's find-only version.

   The find-only rule ("cast can only be attached from the /admin/cast
   directory", 2026-07-25) makes sense for staff, who can open that directory.
   A Creator can't: they typed a real name, the row matched nothing, and the
   save silently dropped it — cast entered by a creator simply vanished (audit
   1.3). The owner's answer on 2026-07-26 was to let creators add people
   themselves: the Person is created together with the project and goes through
   the same moderation, with duplicate names cleaned up by hand in the
   directory. */
type ResolvedActorRow = ReturnType<typeof parseActorRows>[number] & {
  personId: number;
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
  const resolved: (ReturnType<typeof parseActorRows>[number] & { personId: number })[] = [];
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
    });
    if (existing) {
      resolved.push({ ...r, personId: existing.id });
      continue;
    }
    const created = await tx.person.create({
      data: {
        name: r.name,
        ...seedNames(r.name, locale),
        role: r.role,
        kind: r.kind,
        // The headshot the creator uploaded on the row seeds the directory
        // entry too, so the person isn't left as a bare initials avatar.
        photo: r.photo,
      },
      select: { id: true },
    });
    resolved.push({ ...r, personId: created.id });
  }
  return snapshotPersonNames(tx, resolved);
}

/** Mirror of the admin action's snapshotPersonNames: the directory owns the
 *  spellings, the Actor row is a snapshot refreshed on every save. The form
 *  only carries one name (the locale it was shown in), so it must not be
 *  trusted for the name columns. */
async function snapshotPersonNames(
  tx: Prisma.TransactionClient,
  rows: (ReturnType<typeof parseActorRows>[number] & { personId: number })[],
): Promise<ResolvedActorRow[]> {
  if (rows.length === 0) return [];
  const persons = await tx.person.findMany({
    where: { id: { in: [...new Set(rows.map((r) => r.personId))] } },
    select: { id: true, name: true, nameHy: true, nameRu: true, nameEn: true },
  });
  const byId = new Map(persons.map((p) => [p.id, p]));
  return rows.map((r) => {
    const p = byId.get(r.personId);
    return {
      ...r,
      name: p?.name || r.name,
      nameHy: p?.nameHy ?? "",
      nameRu: p?.nameRu ?? "",
      nameEn: p?.nameEn ?? "",
    };
  });
}

/** Rows for prisma.sponsorshipTier.createMany (projectId added by the caller). */
function parseTierRows(fd: FormData) {
  return jsonArray<TierInput>(fd, "tiersRows")
    .filter((r) => (r.name || "").trim())
    .map((r, i) => ({
      dbId: typeof r.dbId === "number" ? r.dbId : null,
      name: (r.name || "").trim().slice(0, VARCHAR_MAX),
      priceAmd: Math.max(0, Number(r.priceAmd) || 0),
      benefits: benefitsToJson(r.benefits || ""),
      image: (r.image || "").trim() || null,
      isExclusive: !!r.isExclusive,
      availableSlots: r.availableSlots == null ? null : Math.max(0, Number(r.availableSlots) || 0),
      totalSlots: r.totalSlots == null ? null : Math.max(0, Number(r.totalSlots) || 0),
      sortOrder: i,
    }));
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
   optional (null -> "on request"), unlike a tier's priceAmd. Deliberately
   duplicated from admin/(panel)/projects/actions.ts, same trust-boundary
   reason as parseTierRows/saveTierRows above. */
function parsePlacementRows(fd: FormData) {
  return jsonArray<PlacementInput>(fd, "placementsRows")
    .filter((r) => (r.title || "").trim())
    .map((r, i) => ({
      dbId: typeof r.dbId === "number" ? r.dbId : null,
      title: (r.title || "").trim().slice(0, VARCHAR_MAX),
      description: benefitsToJson(r.description || ""),
      image: (r.image || "").trim() || null,
      priceAmd: r.priceAmd == null ? null : Math.max(0, Number(r.priceAmd) || 0),
      availableSlots: r.availableSlots == null ? null : Math.max(0, Number(r.availableSlots) || 0),
      totalSlots: r.totalSlots == null ? null : Math.max(0, Number(r.totalSlots) || 0),
      sortOrder: i,
    }));
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

  // Persist any custom Available-on values into the global Streaming Source
  // dictionary (Ф2/#25) so future projects offer them too — never blocks the
  // save. The dictionary used to seed from `streamingSource`; #29 merged that
  // field into `platforms`, so it's the source now.
  try {
    await addStreamingSources(parseCsvInput(data.platforms));
    // Same for the country dictionary: a country typed into this project is
    // offered on every future one (2026-07-27).
    await addCountries(parseCsvInput(data.countries));
    // …and for studios (2026-07-27).
    await addStudios(parseCsvInput(data.studio));
  } catch {
    /* ignore */
  }

  // Same auto-code retry loop as admin createProject — the form never
  // submits a code (readonly/hidden in create mode), so this always runs.
  const autoCode = !data.code;
  const maxAttempts = autoCode ? 5 : 1;
  const actorRows = parseActorRows(fd);
  const tierRows = parseTierRows(fd);
  const placementRows = parsePlacementRows(fd);

  const blocked = submitGate(data, tierRows, t);
  if (blocked) return { error: blocked, values: data };

  const projectData = {
    ...data,
    genres: data.genres.length ? JSON.stringify(data.genres) : null,
    synopsisHy: data.synopsisHy || null,
    synopsisRu: data.synopsisRu || null,
    synopsisEn: data.synopsisEn || null,
    poster: data.poster || null,
    gallery: galleryToJson(data.gallery),
    // Defense in depth: the form never renders the date input while Ongoing
    // is checked, but a save must not trust that alone — force the pair back
    // into agreement here too.
    applicationDeadline: data.applicationDeadlineOngoing ? null : dateOrNull(data.applicationDeadline),
    releaseDate: dateOrNull(data.releaseDate),
    platforms: platformsToJson(data.platforms),
    // #29 merged the old Streaming source field into `platforms`; the
    // `streamingSource` column is not written any more (audit 1.6).
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
        // After cast/tiers/placements have landed, so the snapshot captures
        // the full aggregate the moderator will see, not just the bare row.
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

/** Edit a Creator's OWN project (audit 2.4 / owner decision C.6). Until now the
   only creator-owned mutation was create — a REJECTED (or already-APPROVED)
   project was a dead end, even though the rejection email tells the creator to
   "edit and resubmit". This closes that loop: any save here re-enters
   moderation (PENDING + inactive), whether the project was previously
   REJECTED (a genuine resubmission) or APPROVED (per C.6, editing a published
   project pulls it from the catalog until a moderator re-checks it). Modeled
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
  const existing = await prisma.project.findUnique({
    where: { id },
    select: { ownerId: true },
  });
  if (!existing) notFound();
  if (existing.ownerId !== user.id) notFound();

  const data = buildData(fd);
  const error = validate(data, t);
  if (error) return { error, values: data };

  // Persist any custom Available-on values into the global Streaming Source
  // dictionary (Ф2/#25) so future projects offer them too — never blocks the
  // save. Same as createCreatorProject above.
  try {
    await addStreamingSources(parseCsvInput(data.platforms));
    // Same for the country dictionary: a country typed into this project is
    // offered on every future one (2026-07-27).
    await addCountries(parseCsvInput(data.countries));
    // …and for studios (2026-07-27).
    await addStudios(parseCsvInput(data.studio));
  } catch {
    /* ignore */
  }

  const actorRows = parseActorRows(fd);
  const tierRows = parseTierRows(fd);
  const placementRows = parsePlacementRows(fd);

  const blocked = submitGate(data, tierRows, t);
  if (blocked) return { error: blocked, values: data };

  try {
    // #20²: update the project and fully replace its cast/crew + tiers in one
    // transaction (delete-all then re-insert, same as admin's updateProject).
    // Milestones are untouched — the creator form never submits milestonesRows
    // (admin-only section), so there's nothing to replace here.
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
          // ownerId/code stay untouched (code arrives as a hidden readonly
          // field mirroring the existing value, same as admin edit).
          // A creator-edited project always goes back to moderation (C.6):
          // an APPROVED listing disappears from the catalog until it's
          // re-checked, and a REJECTED one becomes a genuine resubmission —
          // either way the stale rejectionReason no longer applies.
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
  return { ok: true, redirect: "/account/projects" };
}
