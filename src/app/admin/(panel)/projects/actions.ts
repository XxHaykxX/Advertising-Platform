"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect, notFound } from "next/navigation";
import { Prisma } from "@prisma/client";
import type { ProjectStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/require";
import { PLACEMENT_TYPE_VALUES } from "./form-shared";

const STATUS_VALUES = ["PRE_PRODUCTION", "FILMING", "POST_PRODUCTION", "RELEASED"] as const;
const GENDER_VALUES = ["All", "Male", "Female"] as const;
const OPP_TYPE_VALUES = ["visual", "audio"] as const;
const OPP_PROMINENCE_VALUES = ["background", "active"] as const;

export type ProjectFormValues = {
  title: string;
  code: string;
  genre: string;
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
  status: ProjectStatus;
  releaseLabel: string;
  countries: string;
  audienceGender: string;
  audienceAge: string;
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
  slotsTotal: number;
  slotsTaken: number;
  applicationDeadline: string; // <input type=date> value, "" when unset
  releaseDate: string; // <input type=date> value, "" when unset
  platforms: string; // comma-separated in the form; JSON string[] at rest
  placementType: string; // "" | one of PLACEMENT_TYPE_VALUES
  priceNote: string;
};

export type ProjectFormState = { error?: string; values?: ProjectFormValues };
export type SubEditorState = { error?: string; ok?: boolean };

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
  return {
    title: str(fd, "title", VARCHAR_MAX),
    code: str(fd, "code", VARCHAR_MAX),
    genre: str(fd, "genre", VARCHAR_MAX),
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
    status: enumVal(fd, "status", STATUS_VALUES, "PRE_PRODUCTION"),
    releaseLabel: str(fd, "releaseLabel", VARCHAR_MAX),
    countries: str(fd, "countries", VARCHAR_MAX),
    audienceGender: enumVal(fd, "audienceGender", GENDER_VALUES, "All"),
    audienceAge: str(fd, "audienceAge", VARCHAR_MAX),
    projViews: str(fd, "projViews", VARCHAR_MAX),
    budgetMinAmd: intOrNull(fd, "budgetMinAmd"),
    budgetMaxAmd: intOrNull(fd, "budgetMaxAmd"),
    cpmMinAmd: intOrNull(fd, "cpmMinAmd"),
    cpmMaxAmd: intOrNull(fd, "cpmMaxAmd"),
    priceMinAmd: intOrNull(fd, "priceMinAmd"),
    priceMaxAmd: intOrNull(fd, "priceMaxAmd"),
    isActive: bool(fd, "isActive"),
    sortOrder: int(fd, "sortOrder"),
    slotsTotal: Math.max(0, int(fd, "slotsTotal", 5)),
    slotsTaken: Math.max(0, int(fd, "slotsTaken", 0)),
    applicationDeadline: str(fd, "applicationDeadline"),
    releaseDate: str(fd, "releaseDate"),
    platforms: str(fd, "platforms", VARCHAR_MAX),
    placementType: enumVal(fd, "placementType", [...PLACEMENT_TYPE_VALUES, ""] as const, ""),
    priceNote: str(fd, "priceNote", VARCHAR_MAX),
  };
}

function validate(data: ProjectFormValues): string | null {
  if (!data.title) return "Title is required.";
  if (!data.code) return "Code is required.";
  if (!data.genre) return "Genre is required.";
  if (!data.synopsis) return "Synopsis is required.";
  return null;
}

function revalidateProjectPaths(id?: number) {
  // Drop the cached DB reads in src/lib/data/projects.ts (tagged "projects") so
  // an admin edit is visible immediately instead of after the revalidate window.
  // `{ expire: 0 }` expires the tag now (blocking revalidate on next request) —
  // the Next 16 two-arg replacement for the deprecated single-arg call, and the
  // behavior we want here so a publisher sees their save reflected right away.
  revalidateTag("projects", { expire: 0 });
  revalidatePath("/admin/projects");
  revalidatePath("/");
  revalidatePath("/catalog");
  if (id) revalidatePath(`/reports/${id}`);
}

export async function createProject(
  _prev: ProjectFormState,
  fd: FormData,
): Promise<ProjectFormState> {
  const user = await requireUser();
  const data = buildData(fd);
  const error = validate(data);
  if (error) return { error, values: data };

  try {
    await prisma.project.create({
      data: {
        ...data,
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
        // ownerId is always the creating user — never trusted from the form.
        ownerId: user.id,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: `Code "${data.code}" is already in use.`, values: data };
    }
    throw e;
  }

  revalidateProjectPaths();
  redirect("/admin/projects");
}

export async function updateProject(
  id: number,
  _prev: ProjectFormState,
  fd: FormData,
): Promise<ProjectFormState> {
  const user = await requireUser();
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

  try {
    await prisma.project.update({
      where: { id },
      data: {
        ...data,
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
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: `Code "${data.code}" is already in use.`, values: data };
    }
    throw e;
  }

  revalidateProjectPaths(id);
  redirect("/admin/projects");
}

export async function deleteProject(id: number) {
  const user = await requireUser();
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
  const user = await requireUser();
  const existing = await prisma.project.findUnique({
    where: { id },
    select: { ownerId: true },
  });
  if (!existing) return;
  if (user.role !== "SUPERADMIN" && existing.ownerId !== user.id) return;

  await prisma.project.update({ where: { id }, data: { isActive } });
  revalidateProjectPaths(id);
}

// ── Nested sub-editors (placement opportunities / actors) ─────────────────
// Authz is re-checked independently of the parent edit page (defense in
// depth): a Publisher cannot POST directly against another owner's project.

async function authorizeProject(projectId: number): Promise<string | null> {
  const user = await requireUser();
  const existing = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });
  if (!existing) return "Project not found.";
  if (user.role !== "SUPERADMIN" && existing.ownerId !== user.id) return "Not authorized.";
  return null;
}

type OpportunityRow = {
  sceneNo: number;
  description: string;
  mood: string;
  rationale: string;
  type: string;
  prominence: string;
  category: string;
  estValue: number;
  durationSec: number;
};

export async function saveOpportunities(
  projectId: number,
  _prev: SubEditorState,
  fd: FormData,
): Promise<SubEditorState> {
  const authError = await authorizeProject(projectId);
  if (authError) return { error: authError };

  const rows = jsonArray<OpportunityRow>(fd, "rows");

  await prisma.$transaction([
    prisma.placementOpportunity.deleteMany({ where: { projectId } }),
    prisma.placementOpportunity.createMany({
      data: rows.map((r, i) => ({
        projectId,
        sceneNo: Math.max(0, Number(r.sceneNo) || 1),
        description: (r.description || "").trim(),
        mood: (r.mood || "").trim(),
        rationale: (r.rationale || "").trim(),
        type: (OPP_TYPE_VALUES as readonly string[]).includes(r.type) ? r.type : "visual",
        prominence: (OPP_PROMINENCE_VALUES as readonly string[]).includes(r.prominence)
          ? r.prominence
          : "background",
        category: (r.category || "").trim(),
        estValue: Math.max(0, Number(r.estValue) || 0),
        durationSec: Math.max(0, Number(r.durationSec) || 0),
        sortOrder: i,
      })),
    }),
  ]);

  revalidateProjectPaths(projectId);
  return { ok: true };
}

type ActorRow = { name: string; role: string };

export async function saveActors(
  projectId: number,
  _prev: SubEditorState,
  fd: FormData,
): Promise<SubEditorState> {
  const authError = await authorizeProject(projectId);
  if (authError) return { error: authError };

  const rows = jsonArray<ActorRow>(fd, "rows").filter((r) => (r.name || "").trim());

  await prisma.$transaction([
    prisma.actor.deleteMany({ where: { projectId } }),
    prisma.actor.createMany({
      data: rows.map((r, i) => ({
        projectId,
        name: (r.name || "").trim(),
        role: (r.role || "").trim(),
        sortOrder: i,
      })),
    }),
  ]);

  revalidateProjectPaths(projectId);
  return { ok: true };
}
