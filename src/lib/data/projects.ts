import "server-only";
import { prisma } from "@/lib/prisma";
import type { ProjectDTO } from "@/lib/types";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import {
  formatReleaseLabel,
  formatDeadlineLabel,
  formatDateOnly,
  parseStringArray,
} from "@/lib/data/format";

const withRelations = {
  actors: { orderBy: { sortOrder: "asc" } },
  scenes: { orderBy: { sortOrder: "asc" } },
} as const;

type Row = Awaited<ReturnType<typeof fetchOne>>;

/** Public fetch — only active projects are reachable. */
function fetchOne(id: number) {
  return prisma.project.findFirst({
    where: { id, isActive: true },
    include: withRelations,
  });
}

/** Pick the localized variant, falling back to RU. */
function L(ru: string, en: string, hy: string, locale: Locale): string {
  const v = locale === "en" ? en : locale === "hy" ? hy : ru;
  return (v || "").trim() || ru;
}

function toDTO(p: NonNullable<Row>, locale: Locale): ProjectDTO {
  return {
    id: p.id,
    title: L(p.titleRu, p.titleEn, p.titleHy, locale),
    poster: p.poster,
    gallery: parseStringArray(p.gallery),
    genre: L(p.genreRu, p.genreEn, p.genreHy, locale),
    placement: L(p.placementTypeRu, p.placementTypeEn, p.placementTypeHy, locale),
    slotsTotal: p.slotsTotal,
    slotsAvailable: p.slotsAvailable,
    release: formatReleaseLabel(p.releaseDate, locale),
    platforms: parseStringArray(p.platforms),
    deadlineLabel: formatDeadlineLabel(p.bookingDeadline, locale),
    deadlineDate: formatDateOnly(p.bookingDeadline, locale),
    deadline: p.bookingDeadline ? p.bookingDeadline.toISOString() : "",
    description: L(p.descriptionRu, p.descriptionEn, p.descriptionHy, locale),
    actors: p.actors.map((a) => ({
      firstName: L(a.firstName, a.firstNameEn, a.firstNameHy, locale),
      lastName: L(a.lastName, a.lastNameEn, a.lastNameHy, locale),
      role: L(a.role, a.roleEn, a.roleHy, locale),
      photo: a.photo,
    })),
    scenes: p.scenes.map((s) => ({
      title: L(s.title, s.titleEn, s.titleHy, locale),
      description: L(s.description, s.descriptionEn, s.descriptionHy, locale),
      placement: L(s.placement, s.placementEn, s.placementHy, locale),
    })),
  };
}

export async function getProjects(
  activeOnly = true,
  locale: Locale = DEFAULT_LOCALE,
): Promise<ProjectDTO[]> {
  const rows = await prisma.project.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: { sortOrder: "asc" },
    include: withRelations,
  });
  return rows.map((r) => toDTO(r, locale));
}

export async function getProject(
  id: number,
  locale: Locale = DEFAULT_LOCALE,
): Promise<ProjectDTO | null> {
  if (!Number.isFinite(id)) return null;
  const p = await fetchOne(id);
  return p ? toDTO(p, locale) : null;
}

export async function getProjectIds(): Promise<number[]> {
  const rows = await prisma.project.findMany({
    where: { isActive: true },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}
