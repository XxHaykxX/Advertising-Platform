import "server-only";
import { prisma } from "@/lib/prisma";
import type { ProjectListDTO, ProjectDetailDTO } from "@/lib/types";

export async function getProjects(activeOnly = true): Promise<ProjectListDTO[]> {
  const rows = await prisma.project.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { opportunities: true } } },
  });
  return rows.map((p) => ({
    id: p.id,
    code: p.code,
    title: p.title,
    genre: p.genre,
    synopsis: p.synopsis,
    poster: p.poster ?? "",
    format: p.format,
    studio: p.studio,
    countries: p.countries,
    audienceGender: p.audienceGender,
    audienceAge: p.audienceAge,
    projViews: p.projViews,
    budgetRange: p.budgetRange,
    safety: p.safety,
    safetyScore: p.safetyScore,
    opportunitiesCount: p._count.opportunities,
  }));
}

export async function getProject(id: number, activeOnly = false): Promise<ProjectDetailDTO | null> {
  const p = await prisma.project.findFirst({
    where: activeOnly ? { id, isActive: true } : { id },
    include: {
      safetyCats: { orderBy: { sortOrder: "asc" } },
      opportunities: { orderBy: { sortOrder: "asc" } },
      actors: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!p) return null;
  const exposureTotal = p.opportunities.reduce((s, o) => s + o.estValue, 0);
  return {
    id: p.id,
    code: p.code,
    title: p.title,
    genre: p.genre,
    synopsis: p.synopsis,
    poster: p.poster ?? "",
    gallery: p.gallery ?? "[]",
    format: p.format,
    studio: p.studio,
    status: p.status,
    releaseLabel: p.releaseLabel,
    countries: p.countries,
    audienceGender: p.audienceGender,
    audienceAge: p.audienceAge,
    projViews: p.projViews,
    cpmRange: p.cpmRange,
    budgetRange: p.budgetRange,
    safety: p.safety,
    safetyScore: p.safetyScore,
    safetyCats: p.safetyCats.map((c) => ({ name: c.name, score: c.score, aiText: c.aiText })),
    opportunities: p.opportunities.map((o) => ({
      sceneNo: o.sceneNo,
      description: o.description,
      mood: o.mood,
      rationale: o.rationale,
      type: o.type,
      prominence: o.prominence,
      category: o.category,
      estValue: o.estValue,
      durationSec: o.durationSec,
      safety: o.safety,
    })),
    exposureTotal,
    opportunitiesCount: p.opportunities.length,
    slotsTotal: p.slotsTotal,
    slotsTaken: p.slotsTaken,
    applicationDeadline: p.applicationDeadline?.toISOString() ?? null,
    releaseDate: p.releaseDate?.toISOString() ?? null,
    platforms: p.platforms ?? "[]",
    placementType: p.placementType,
    priceNote: p.priceNote,
    actors: p.actors.map((a) => ({ id: a.id, name: a.name, role: a.role })),
  };
}

export async function getProjectIds(): Promise<number[]> {
  const rows = await prisma.project.findMany({
    where: { isActive: true },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}
