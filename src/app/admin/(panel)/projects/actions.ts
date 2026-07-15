"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { notFound } from "next/navigation";
import { Prisma } from "@prisma/client";
import type { ProjectStatus, ProjectKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireContentEditor } from "@/lib/auth/require";
import { PLACEMENT_TYPE_VALUES, KIND_VALUES } from "./form-shared";

const STATUS_VALUES = ["PRE_PRODUCTION", "FILMING", "POST_PRODUCTION", "RELEASED"] as const;
const GENDER_VALUES = ["All", "Male", "Female"] as const;

export type ProjectFormValues = {
  title: string;
  code: string;
  genre: string; // legacy single-genre display value; kept in sync with genres[0]
  genres: string[]; // multi-genre picks (Genre MultiSelect)
  synopsis: string;
  // ── Per-locale translations (fall back to title/synopsis above) ──
  titleHy: string;
  titleRu: string;
  titleEn: string;
  synopsisHy: string;
  synopsisRu: string;
  synopsisEn: string;
  poster: string;
  gallery: string; // newline/comma-separated image URLs in the form; JSON string[] at rest
  format: string;
  studio: string;
  // ── Film/Serial (#19) ──
  kind: ProjectKind;
  episodes: number | null; // SERIAL only
  episodeMinutes: number | null; // SERIAL only
  status: ProjectStatus;
  releaseLabel: string;
  countries: string;
  audienceGender: string;
  audienceAge: string;
  ageRating: string; // content rating badge ("16+", "18+"); "" when unset
  projViews: string;
  // Money — AMD only, all optional (blank -> null). Placement price
  // (priceMinAmd/priceMaxAmd) drives the "on request" fallback on the public
  // site when left unset.
  budgetMinAmd: number | null;
  budgetMaxAmd: number | null;
  cpmMinAmd: number | null;
  cpmMaxAmd: number | null;
  priceMinAmd: number | null;
  priceMaxAmd: number | null;
  isActive: boolean;
  sortOrder: number;
  // ── Placement parity fields ──
  applicationDeadline: string; // <input type=date> value, "" when unset
  releaseDate: string; // <input type=date> value, "" when unset
  platforms: string; // comma-separated in the form; JSON string[] at rest
  placementType: string; // "" | one of PLACEMENT_TYPE_VALUES
  priceNote: string;
  // ── Press-kit fields (Aram, 2026-07-09) ──
  tagline: string; // one-line logline (hero)
  subgenre: string; // e.g. "Musical" (hero meta, next to genre)
  references: string; // comparable titles, comma-separated ("Bohemian Rhapsody, Ray")
  cinemas: string; // exhibition venues, comma-separated ("Cinema Star, Kino Park")
};

export type ProjectFormState = {
  error?: string;
  values?: ProjectFormValues;
  // On success the action returns { ok: true, redirect } instead of calling
  // redirect() itself (see revalidateProjectPaths for why) — the client form
  // navigates on this signal (2026-07-15 bugfix).
  ok?: boolean;
  redirect?: string;
};

// MySQL caps a plain (non-@db.Text) Prisma String column at VarChar(191);
// anything longer throws an unhandled P2000 ("value too long"). Truncate at
// the form-parsing boundary so a save always succeeds instead of 500ing.
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

// ── Slots/deadline/platforms form <-> DB conversions ──────────────────────
// The form works with plain strings (date-input values, comma-separated
// platform lists); the DB stores DateTime? / JSON-string columns. Converting
// at this boundary keeps ProjectFormValues serializable and round-trippable
// through useActionState's echoed `values` on a failed submit.

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
  // Genre/Countries/Platforms/Cinemas now ride in as JSON string[] (the
  // MultiSelect's hidden input) — parse once and re-derive the legacy
  // CSV/single-string columns the rest of the app still reads.
  const genres = jsonArray<string>(fd, "genres");
  const kind = enumVal(fd, "kind", KIND_VALUES, "FILM");
  return {
    title: str(fd, "title", VARCHAR_MAX),
    code: str(fd, "code", VARCHAR_MAX),
    genre: (genres[0] || "").slice(0, VARCHAR_MAX),
    genres,
    synopsis: str(fd, "synopsis"),
    titleHy: str(fd, "titleHy", VARCHAR_MAX),
    titleRu: str(fd, "titleRu", VARCHAR_MAX),
    titleEn: str(fd, "titleEn", VARCHAR_MAX),
    synopsisHy: str(fd, "synopsisHy"),
    synopsisRu: str(fd, "synopsisRu"),
    synopsisEn: str(fd, "synopsisEn"),
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

function validate(data: ProjectFormValues): string | null {
  if (!data.title) return "Title is required.";
  if (data.genres.length === 0) return "Genre is required.";
  if (!data.synopsis) return "Synopsis is required.";
  return null;
}

// ── Inline cast/crew + sponsorship tiers (#20²) ───────────────────────────
// Both used to be standalone sub-editor forms (saveActors/saveTiers) that only
// worked in edit mode. They now ride in the main project form as hidden
// `actorsRows`/`tiersRows` JSON inputs and are persisted in the SAME
// transaction as the project — so a project + its cast + its tiers all save in
// one submit, on create and edit alike. Authz is the parent action's
// (requireContentEditor + ownership), so no separate re-check is needed.
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
// Code is no longer a manual field on create: find the highest sequence
// number already used for the current year and take the next one, zero-padded
// to 4 digits. Uniqueness is still enforced by the DB's @unique constraint —
// createProject retries with a freshly generated code on a P2002 race.
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

function revalidateProjectPaths(id?: number) {
  // Drop the cached DB reads in src/lib/data/projects.ts (tagged "projects") so
  // an admin edit is visible on next visit. `"max"` marks the tag stale
  // (stale-while-revalidate) — the Next 16 recommended two-arg form; the old
  // `{ expire: 0 }` blocking-expire form (plus revalidatePath("/") /
  // "/catalog") forced an immediate reseed from the root layout down, which
  // crashed the in-flight useActionState navigation with a black screen
  // ("This page couldn't load") — see 2026-07-15 bugfix. Public pages still
  // pick up the change via the tag within the visitor's next request.
  revalidateTag("projects", "max");
  revalidatePath("/admin/projects");
  if (id) revalidatePath(`/reports/${id}`);
}

export async function createProject(
  _prev: ProjectFormState,
  fd: FormData,
): Promise<ProjectFormState> {
  const user = await requireContentEditor();
  const data = buildData(fd);
  const error = validate(data);
  if (error) return { error, values: data };

  // #17: Code is generated, not typed — the form no longer submits one on
  // create (data.code === ""). Retry a handful of times on a P2002 race
  // (two publishers saving in the same instant) by regenerating; a manually
  // supplied code (defensive — the field is readonly in the UI) is tried once.
  const autoCode = !data.code;
  const maxAttempts = autoCode ? 5 : 1;
  const actorRows = parseActorRows(fd);
  const tierRows = parseTierRows(fd);

  // Project columns shared across code-retry attempts (code is added per-attempt).
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
    // ownerId is always the creating user — never trusted from the form.
    ownerId: user.id,
    // #13: staff (SUPERADMIN/PUBLISHER) content is trusted and goes
    // straight to the public catalog — no moderation queue. This is
    // also the schema default, but set explicitly here so intent is
    // unambiguous if the Creator submission flow (#16) ever reuses
    // this action instead of its own. Creator-submitted projects must
    // start PENDING, not APPROVED.
    moderationStatus: "APPROVED" as const,
  };

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const code = autoCode ? await generateProjectCode() : data.code;
    try {
      // #20²: project + its cast/crew + its tiers all commit together. A P2002
      // on the (unique) code rolls the whole tx back and we regenerate + retry.
      await prisma.$transaction(async (tx) => {
        const created = await tx.project.create({ data: { ...projectData, code } });
        if (actorRows.length) {
          await tx.actor.createMany({
            data: actorRows.map((r) => ({ ...r, projectId: created.id })),
          });
        }
        if (tierRows.length) {
          await tx.sponsorshipTier.createMany({
            data: tierRows.map((r) => ({ ...r, projectId: created.id })),
          });
        }
      });
      revalidateProjectPaths();
      return { ok: true, redirect: "/admin/projects" };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        if (autoCode && attempt < maxAttempts) continue; // regenerate + retry
        return { error: `Code "${code}" is already in use.`, values: data };
      }
      throw e;
    }
  }
  return { error: "Could not generate a unique project code — please retry.", values: data };
}

export async function updateProject(
  id: number,
  _prev: ProjectFormState,
  fd: FormData,
): Promise<ProjectFormState> {
  const user = await requireContentEditor();
  const isSuperadmin = user.role === "SUPERADMIN";

  const existing = await prisma.project.findUnique({
    where: { id },
    select: { ownerId: true },
  });
  // 404 for both "doesn't exist" and "not yours" — a Publisher must not be
  // able to distinguish the two.
  if (!existing) notFound();
  if (!isSuperadmin && existing.ownerId !== user.id) notFound();

  const data = buildData(fd);
  const error = validate(data);
  if (error) return { error, values: data };

  const actorRows = parseActorRows(fd);
  const tierRows = parseTierRows(fd);

  try {
    // #20²: update the project and fully replace its cast/crew + tiers in one
    // transaction (delete-all then re-insert mirrors the old saveActors/saveTiers
    // semantics, now folded into the single main-form submit).
    const ops: Prisma.PrismaPromise<unknown>[] = [
      prisma.project.update({
        where: { id },
        data: {
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
        },
      }),
      prisma.actor.deleteMany({ where: { projectId: id } }),
    ];
    if (actorRows.length) {
      ops.push(prisma.actor.createMany({ data: actorRows.map((r) => ({ ...r, projectId: id })) }));
    }
    ops.push(prisma.sponsorshipTier.deleteMany({ where: { projectId: id } }));
    if (tierRows.length) {
      ops.push(
        prisma.sponsorshipTier.createMany({ data: tierRows.map((r) => ({ ...r, projectId: id })) }),
      );
    }
    await prisma.$transaction(ops);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: `Code "${data.code}" is already in use.`, values: data };
    }
    throw e;
  }

  revalidateProjectPaths(id);
  return { ok: true, redirect: "/admin/projects" };
}

export async function deleteProject(id: number) {
  const user = await requireContentEditor();
  const existing = await prisma.project.findUnique({
    where: { id },
    select: { ownerId: true },
  });
  if (!existing) return;
  if (user.role !== "SUPERADMIN" && existing.ownerId !== user.id) return;

  await prisma.project.delete({ where: { id } });
  revalidateProjectPaths(id);
}

export async function toggleActive(id: number, isActive: boolean) {
  const user = await requireContentEditor();
  const existing = await prisma.project.findUnique({
    where: { id },
    select: { ownerId: true },
  });
  if (!existing) return;
  if (user.role !== "SUPERADMIN" && existing.ownerId !== user.id) return;

  await prisma.project.update({ where: { id }, data: { isActive } });
  revalidateProjectPaths(id);
}

// ── Duplicate a project as a template (#20²) ───────────────────────────────
// Clones every scalar column plus cast/crew + tiers into a brand-new project
// owned by the current user, with a freshly generated code, an inactive
// ("(copy)") draft state so it can't accidentally hit the public catalog, and
// a re-run of the auto-code retry loop. Returns { redirect } for the client to
// navigate (same safe pattern as create/update — never redirect() inside a
// transition, per the 2026-07-15 black-screen bugfix).
export async function duplicateProject(
  id: number,
): Promise<{ ok?: boolean; redirect?: string; error?: string }> {
  const user = await requireContentEditor();
  const src = await prisma.project.findUnique({
    where: { id },
    include: {
      actors: { orderBy: { sortOrder: "asc" } },
      tiers: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!src) return { error: "Project not found." };
  // Ownership scoping mirrors updateProject: a Publisher can only clone their own.
  if (user.role !== "SUPERADMIN" && src.ownerId !== user.id) return { error: "Not authorized." };

  // Strip identity/relations/timestamps; keep every other scalar column verbatim.
  const {
    id: _id,
    code: _code,
    ownerId: _ownerId,
    createdAt: _createdAt,
    actors,
    tiers,
    ...scalars
  } = src;

  for (let attempt = 1; attempt <= 5; attempt++) {
    const code = await generateProjectCode();
    try {
      const created = await prisma.$transaction(async (tx) => {
        const proj = await tx.project.create({
          data: {
            ...scalars,
            title: `${src.title} (copy)`.slice(0, VARCHAR_MAX),
            code,
            isActive: false,
            moderationStatus: "APPROVED",
            ownerId: user.id,
          },
        });
        if (actors.length) {
          await tx.actor.createMany({
            data: actors.map((a, i) => ({
              projectId: proj.id,
              name: a.name,
              role: a.role,
              kind: a.kind,
              photo: a.photo,
              sortOrder: i,
            })),
          });
        }
        if (tiers.length) {
          await tx.sponsorshipTier.createMany({
            data: tiers.map((tier, i) => ({
              projectId: proj.id,
              name: tier.name,
              priceAmd: tier.priceAmd,
              benefits: tier.benefits,
              sortOrder: i,
            })),
          });
        }
        return proj;
      });
      revalidateProjectPaths();
      return { ok: true, redirect: `/admin/projects/${created.id}/edit` };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002" && attempt < 5) {
        continue; // code race — regenerate + retry
      }
      throw e;
    }
  }
  return { error: "Could not generate a unique project code — please retry." };
}
