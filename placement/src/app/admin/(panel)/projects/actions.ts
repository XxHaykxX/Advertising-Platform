"use server";

import { revalidatePath } from "next/cache";
import { redirect, notFound } from "next/navigation";
import { Prisma } from "@prisma/client";
import type { ProjectStatus, BrandSafety } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/require";

const STATUS_VALUES = ["PRE_PRODUCTION", "FILMING", "POST_PRODUCTION", "RELEASED"] as const;
const SAFETY_VALUES = ["SAFE", "REVIEW", "RISK"] as const;
const GENDER_VALUES = ["All", "Male", "Female"] as const;
const OPP_TYPE_VALUES = ["visual", "audio"] as const;
const OPP_PROMINENCE_VALUES = ["background", "active"] as const;

export type ProjectFormValues = {
  title: string;
  code: string;
  genre: string;
  synopsis: string;
  poster: string;
  format: string;
  studio: string;
  status: ProjectStatus;
  releaseLabel: string;
  countries: string;
  audienceGender: string;
  audienceAge: string;
  projViews: string;
  cpmRange: string;
  budgetRange: string;
  safetyScore: number;
  safety: BrandSafety;
  isActive: boolean;
  sortOrder: number;
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
function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
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

function buildData(fd: FormData): ProjectFormValues {
  return {
    title: str(fd, "title", VARCHAR_MAX),
    code: str(fd, "code", VARCHAR_MAX),
    genre: str(fd, "genre", VARCHAR_MAX),
    synopsis: str(fd, "synopsis"),
    poster: str(fd, "poster", VARCHAR_MAX),
    format: str(fd, "format", VARCHAR_MAX),
    studio: str(fd, "studio", VARCHAR_MAX),
    status: enumVal(fd, "status", STATUS_VALUES, "PRE_PRODUCTION"),
    releaseLabel: str(fd, "releaseLabel", VARCHAR_MAX),
    countries: str(fd, "countries", VARCHAR_MAX),
    audienceGender: enumVal(fd, "audienceGender", GENDER_VALUES, "All"),
    audienceAge: str(fd, "audienceAge", VARCHAR_MAX),
    projViews: str(fd, "projViews", VARCHAR_MAX),
    cpmRange: str(fd, "cpmRange", VARCHAR_MAX),
    budgetRange: str(fd, "budgetRange", VARCHAR_MAX),
    safetyScore: clamp(int(fd, "safetyScore"), 0, 100),
    safety: enumVal(fd, "safety", SAFETY_VALUES, "REVIEW"),
    isActive: bool(fd, "isActive"),
    sortOrder: int(fd, "sortOrder"),
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
        poster: data.poster || null,
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
      data: { ...data, poster: data.poster || null },
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

// ── Nested sub-editors (safety categories / placement opportunities) ──────
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

type SafetyCatRow = { name: string; score: number; aiText: string };

export async function saveSafetyCats(
  projectId: number,
  _prev: SubEditorState,
  fd: FormData,
): Promise<SubEditorState> {
  const authError = await authorizeProject(projectId);
  if (authError) return { error: authError };

  const rows = jsonArray<SafetyCatRow>(fd, "rows");

  await prisma.$transaction([
    prisma.safetyCategory.deleteMany({ where: { projectId } }),
    prisma.safetyCategory.createMany({
      data: rows.map((r, i) => ({
        projectId,
        name: (r.name || "").trim(),
        score: clamp(Number(r.score) || 0, 0, 100),
        aiText: (r.aiText || "").trim(),
        sortOrder: i,
      })),
    }),
  ]);

  revalidateProjectPaths(projectId);
  return { ok: true };
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
  safety: number;
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
        safety: clamp(Number(r.safety) || 0, 0, 100),
        sortOrder: i,
      })),
    }),
  ]);

  revalidateProjectPaths(projectId);
  return { ok: true };
}
