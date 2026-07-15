"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { Prisma, type ProjectKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/auth/require";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";
import { notifyNewProjectForModeration } from "@/lib/mail";

/* #16: creator self-serve project submission. A CREATOR posts a light-weight
   form (a small subset of the admin project-form.tsx fields); the resulting
   row always starts moderationStatus=PENDING / isActive=false — it only
   reaches the public catalog once a moderator approves it in
   /admin/moderation (see admin/(panel)/moderation/actions.ts). Kept
   independent from admin/(panel)/projects/actions.ts (deliberately not
   imported/reused — different zone, different trust level: staff-authored
   projects go straight to APPROVED, creator-authored ones never do). */

const KIND_VALUES = ["FILM", "SERIAL"] as const;

// MySQL caps a plain (non-@db.Text) Prisma String column at VarChar(191) —
// same boundary as the admin form's buildData().
const VARCHAR_MAX = 191;

export type CreatorProjectFormValues = {
  title: string;
  synopsis: string;
  genres: string[];
  kind: ProjectKind;
  episodes: number | null;
  episodeMinutes: number | null;
  poster: string;
  format: string;
  studio: string;
  countries: string;
};

export type CreatorProjectFormState = {
  error?: string;
  values?: CreatorProjectFormValues;
  // On success the action returns { ok: true, redirect } instead of calling
  // redirect() itself — same useActionState + client-navigation pattern as
  // register/actions.ts and admin/(panel)/projects/actions.ts (a nested
  // redirect() inside this response crashes the in-flight flight tree).
  ok?: boolean;
  redirect?: string;
};

function str(fd: FormData, key: string, maxLen?: number) {
  const v = String(fd.get(key) || "").trim();
  return maxLen ? v.slice(0, maxLen) : v;
}
function intOrNull(fd: FormData, key: string): number | null {
  const raw = String(fd.get(key) || "").trim();
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
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

function buildData(fd: FormData): CreatorProjectFormValues {
  const genres = jsonArray<string>(fd, "genres");
  const kind = enumVal(fd, "kind", KIND_VALUES, "FILM");
  return {
    title: str(fd, "title", VARCHAR_MAX),
    synopsis: str(fd, "synopsis"),
    genres,
    kind,
    episodes: kind === "SERIAL" ? intOrNull(fd, "episodes") : null,
    episodeMinutes: kind === "SERIAL" ? intOrNull(fd, "episodeMinutes") : null,
    poster: str(fd, "poster", VARCHAR_MAX),
    format: str(fd, "format", VARCHAR_MAX),
    studio: str(fd, "studio", VARCHAR_MAX),
    countries: str(fd, "countries", VARCHAR_MAX),
  };
}

function isValid(data: CreatorProjectFormValues): boolean {
  return !!(data.title && data.synopsis && data.genres.length > 0);
}

// ── Auto Code generation (#PP-YYYY-NNNN) ───────────────────────────────────
// Deliberately duplicated from admin/(panel)/projects/actions.ts rather than
// imported — that module is a different zone/trust boundary for this task.
// Uniqueness is still enforced by the DB's @unique constraint; create()
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
  _prev: CreatorProjectFormState,
  fd: FormData,
): Promise<CreatorProjectFormState> {
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
  if (!isValid(data)) return { error: t("account.form.errRequired"), values: data };

  const maxAttempts = 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const code = await generateProjectCode();
    try {
      const project = await prisma.project.create({
        data: {
          code,
          title: data.title,
          genre: data.genres[0],
          genres: JSON.stringify(data.genres),
          synopsis: data.synopsis,
          poster: data.poster || null,
          format: data.format,
          studio: data.studio,
          countries: data.countries,
          kind: data.kind,
          episodes: data.episodes,
          episodeMinutes: data.episodeMinutes,
          // ownerId is always the submitting member — never trusted from the form.
          ownerId: user.id,
          // Creator submissions always start PENDING + inactive: they only
          // reach the public catalog once a moderator approves them (unlike
          // staff-authored projects in admin/(panel)/projects/actions.ts,
          // which go straight to APPROVED).
          moderationStatus: "PENDING",
          isActive: false,
        },
        select: { id: true, title: true, code: true, ownerId: true },
      });

      // #22: notify the moderation team by email. Fire-and-forget / non-blocking
      // so a mail outage never breaks a creator's submission.
      notifyNewProjectForModeration(project).catch(() => {});

      revalidateTag("projects", "max");
      revalidatePath("/account/projects");
      revalidatePath("/admin/moderation");
      return { ok: true, redirect: "/account/projects" };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        if (attempt < maxAttempts) continue; // regenerate + retry
        return { error: t("account.form.errCode"), values: data };
      }
      throw e;
    }
  }
  return { error: "Could not generate a unique project code — please retry.", values: data };
}
