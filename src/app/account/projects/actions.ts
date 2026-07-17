"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/auth/require";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";
import { notifyNewProjectForModeration } from "@/lib/mail";
import { PLACEMENT_TYPE_VALUES, KIND_VALUES } from "@/app/admin/(panel)/projects/form-shared";
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
const GENDER_VALUES = ["All", "Male", "Female"] as const;

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
    format: str(fd, "format", VARCHAR_MAX),
    studio: str(fd, "studio", VARCHAR_MAX),
    kind,
    episodes: kind === "SERIAL" ? intOrNull(fd, "episodes") : null,
    episodeMinutes: kind === "SERIAL" ? intOrNull(fd, "episodeMinutes") : null,
    status: enumVal(fd, "status", STATUS_VALUES, "PRE_PRODUCTION"),
    releaseLabel: str(fd, "releaseLabel", VARCHAR_MAX),
    countries: jsonArray<string>(fd, "countries").join(", ").slice(0, VARCHAR_MAX),
    audienceGender: enumVal(fd, "audienceGender", GENDER_VALUES, "All"),
    audienceAge: str(fd, "audienceAge", VARCHAR_MAX),
    ageRating: str(fd, "ageRating", VARCHAR_MAX),
    projViews: str(fd, "projViews", VARCHAR_MAX),
    budgetMinAmd: intOrNull(fd, "budgetMinAmd"),
    budgetMaxAmd: intOrNull(fd, "budgetMaxAmd"),
    cpmMinAmd: intOrNull(fd, "cpmMinAmd"),
    cpmMaxAmd: intOrNull(fd, "cpmMaxAmd"),
    priceMinAmd: intOrNull(fd, "priceMinAmd"),
    priceMaxAmd: intOrNull(fd, "priceMaxAmd"),
    // Never trusted from the form for a Creator submission — forced to false
    // below regardless of what buildData parses here.
    isActive: bool(fd, "isActive"),
    sortOrder: int(fd, "sortOrder"),
    applicationDeadline: str(fd, "applicationDeadline"),
    releaseDate: str(fd, "releaseDate"),
    platforms: jsonArray<string>(fd, "platforms").join(", ").slice(0, VARCHAR_MAX),
    placementType: enumVal(fd, "placementType", [...PLACEMENT_TYPE_VALUES, ""] as const, ""),
    priceNote: str(fd, "priceNote", VARCHAR_MAX),
    tagline: str(fd, "tagline", VARCHAR_MAX),
    subgenre: str(fd, "subgenre", VARCHAR_MAX),
    references: str(fd, "references"),
    cinemas: jsonArray<string>(fd, "cinemas").join(", "),
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
type ActorInput = { name?: string; role?: string; kind?: string; photo?: string };
type TierInput = { name?: string; priceAmd?: number; benefits?: string };

/** "line 1\nline 2" -> JSON string[] (trimmed, blanks dropped) for the
   benefits @db.Text column. */
function benefitsToJson(input: string): string {
  const arr = (input || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  return JSON.stringify(arr);
}

/** Rows for prisma.actor.createMany (projectId added by the caller). Blank-name
   rows are dropped; kind falls back to CAST. */
function parseActorRows(fd: FormData) {
  return jsonArray<ActorInput>(fd, "actorsRows")
    .filter((r) => (r.name || "").trim())
    .map((r, i) => ({
      name: (r.name || "").trim(),
      role: (r.role || "").trim(),
      kind: (ACTOR_KIND_VALUES as readonly string[]).includes(r.kind ?? "") ? r.kind! : "CAST",
      photo: (r.photo || "").trim() || null,
      sortOrder: i,
    }));
}

/** Rows for prisma.sponsorshipTier.createMany (projectId added by the caller). */
function parseTierRows(fd: FormData) {
  return jsonArray<TierInput>(fd, "tiersRows")
    .filter((r) => (r.name || "").trim())
    .map((r, i) => ({
      name: (r.name || "").trim().slice(0, VARCHAR_MAX),
      priceAmd: Math.max(0, Number(r.priceAmd) || 0),
      benefits: benefitsToJson(r.benefits || ""),
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
    platforms: platformsToJson(data.platforms),
    placementType: data.placementType || null,
    priceNote: data.priceNote || null,
    tagline: data.tagline || null,
    subgenre: data.subgenre || null,
    references: data.references || null,
    cinemas: data.cinemas || null,
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
          await tx.actor.createMany({
            data: actorRows.map((r) => ({ ...r, projectId: project.id })),
          });
        }
        if (tierRows.length) {
          await tx.sponsorshipTier.createMany({
            data: tierRows.map((r) => ({ ...r, projectId: project.id })),
          });
        }
        return project;
      });

      // #22: notify the moderation team by email. Fire-and-forget / non-blocking
      // so a mail outage never breaks a creator's submission.
      notifyNewProjectForModeration({ id: created.id, title: created.title }).catch(() => {});

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
