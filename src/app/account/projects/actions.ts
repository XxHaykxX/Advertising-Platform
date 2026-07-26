"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/auth/require";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";
import { notifyNewProjectForModeration } from "@/lib/mail";
import { notifyRoles } from "@/lib/data/notifications";
import { addStreamingSources } from "@/lib/actions/streaming-sources";
import { PLACEMENT_TYPE_VALUES, KIND_VALUES, ROLE_VALUES, kindForRole, parseCsvInput } from "@/app/admin/(panel)/projects/form-shared";
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

const STATUS_VALUES = ["PRE_PRODUCTION", "FILMING", "POST_PRODUCTION", "RELEASED"] as const;

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
    title: (titleRu || titleHy || titleEn).slice(0, VARCHAR_MAX),
    code: str(fd, "code", VARCHAR_MAX),
    genre: (genres[0] || "").slice(0, VARCHAR_MAX),
    genres,
    synopsis: synopsisRu || synopsisHy || synopsisEn,
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
    studio: str(fd, "studio", VARCHAR_MAX),
    kind,
    episodes: kind === "SERIAL" ? intOrNull(fd, "episodes") : null,
    episodeMinutes: kind === "SERIAL" ? intOrNull(fd, "episodeMinutes") : null,
    durationMinutes: kind === "FILM" ? intOrNull(fd, "durationMinutes") : null,
    status: enumVal(fd, "status", STATUS_VALUES, "PRE_PRODUCTION"),
    countries: jsonArray<string>(fd, "countries").join(", ").slice(0, VARCHAR_MAX),
    ageRating: str(fd, "ageRating", VARCHAR_MAX),
    boxOfficeAmd: intOrNull(fd, "boxOfficeAmd"),
    // Never trusted from the form for a Creator submission — forced to false
    // below regardless of what buildData parses here.
    isActive: bool(fd, "isActive"),
    sortOrder: int(fd, "sortOrder"),
    applicationDeadline: str(fd, "applicationDeadline"),
    releaseDate: str(fd, "releaseDate"),
    expectedReleaseDate: str(fd, "expectedReleaseDate"),
    platforms: jsonArray<string>(fd, "platforms").join(", ").slice(0, VARCHAR_MAX),
    streamingSource: jsonArray<string>(fd, "streamingSource").join(", ").slice(0, VARCHAR_MAX),
    placementType: enumVal(fd, "placementType", [...PLACEMENT_TYPE_VALUES, ""] as const, ""),
    tagline: taglineRu || taglineHy || taglineEn,
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
  return null;
}

// ── Inline cast/crew + sponsorship tiers (#20², carried over from admin) ──
const ACTOR_KIND_VALUES = ["CAST", "CREW"] as const;
type ActorInput = { name?: string; roles?: string[]; kind?: string; photo?: string; personId?: number | null };
type TierInput = {
  name?: string;
  priceAmd?: number;
  benefits?: string;
  isExclusive?: boolean;
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

/** FIND-ONLY resolve — see the admin action's resolveActorPersonIds for the
   full rationale. Never creates a Person: rows with a personId pass through,
   typed-only names match an existing directory Person by name, and unmatched
   rows are DROPPED (no auto-create, user request 2026-07-25). Duplicated rather
   than imported (same "different zone/trust level" reasoning as the auto-code
   generator below). */
async function resolveActorPersonIds(
  tx: Prisma.TransactionClient,
  rows: ReturnType<typeof parseActorRows>,
): Promise<(ReturnType<typeof parseActorRows>[number] & { personId: number })[]> {
  const resolved: (ReturnType<typeof parseActorRows>[number] & { personId: number })[] = [];
  for (const r of rows) {
    if (r.personId != null) {
      resolved.push({ ...r, personId: r.personId });
      continue;
    }
    const existing = await tx.person.findFirst({ where: { name: r.name } });
    if (existing) resolved.push({ ...r, personId: existing.id });
    // else: no directory match -> drop the row (no auto-create).
  }
  return resolved;
}

/** Rows for prisma.sponsorshipTier.createMany (projectId added by the caller). */
function parseTierRows(fd: FormData) {
  return jsonArray<TierInput>(fd, "tiersRows")
    .filter((r) => (r.name || "").trim())
    .map((r, i) => ({
      name: (r.name || "").trim().slice(0, VARCHAR_MAX),
      priceAmd: Math.max(0, Number(r.priceAmd) || 0),
      benefits: benefitsToJson(r.benefits || ""),
      isExclusive: !!r.isExclusive,
      availableSlots: r.availableSlots == null ? null : Math.max(0, Number(r.availableSlots) || 0),
      totalSlots: r.totalSlots == null ? null : Math.max(0, Number(r.totalSlots) || 0),
      sortOrder: i,
    }));
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
  } catch {
    /* ignore */
  }

  // Same auto-code retry loop as admin createProject — the form never
  // submits a code (readonly/hidden in create mode), so this always runs.
  const autoCode = !data.code;
  const maxAttempts = autoCode ? 5 : 1;
  const actorRows = parseActorRows(fd);
  const tierRows = parseTierRows(fd);

  const projectData = {
    ...data,
    genres: data.genres.length ? JSON.stringify(data.genres) : null,
    synopsisHy: data.synopsisHy || null,
    synopsisRu: data.synopsisRu || null,
    synopsisEn: data.synopsisEn || null,
    poster: data.poster || null,
    gallery: galleryToJson(data.gallery),
    applicationDeadline: dateOrNull(data.applicationDeadline),
    releaseDate: dateOrNull(data.releaseDate),
    expectedReleaseDate: dateOrNull(data.expectedReleaseDate),
    platforms: platformsToJson(data.platforms),
    // #29: no longer written from the form (merged into `platforms` above) —
    // the column stays for now, just always cleared on save.
    streamingSource: null,
    placementType: data.placementType || null,
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
          const resolvedActors = await resolveActorPersonIds(tx, actorRows);
          await tx.actor.createMany({
            data: resolvedActors.map((r) => ({ ...r, projectId: project.id })),
          });
        }
        if (tierRows.length) {
          await tx.sponsorshipTier.createMany({
            data: tierRows.map((r) => ({ ...r, projectId: project.id })),
          });
        }
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

      revalidateTag("projects", "max");
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
