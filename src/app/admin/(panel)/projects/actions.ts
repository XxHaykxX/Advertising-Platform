"use server";

import { revalidatePath } from "next/cache";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/require";

// Raw values echoed back to the client on a failed submit (design decision:
// validation errors must never wipe the form — see Task #11). These mirror
// exactly what the user submitted, so the form can repopulate every field.
export type ProjectFormValues = {
  titleRu: string; titleEn: string; titleHy: string;
  genreRu: string; genreEn: string; genreHy: string;
  descriptionRu: string; descriptionEn: string; descriptionHy: string;
  placementTypeRu: string; placementTypeEn: string; placementTypeHy: string;
  price: string; currency: string;
  slotsTotal: number; slotsAvailable: number;
  releaseDate: string; bookingDeadline: string;
  platforms: string[];
  sortOrder: number;
  isActive: boolean;
  actors: ActorInput[];
  scenes: SceneInput[];
};

export type ProjectFormState = { error?: string; values?: ProjectFormValues };

type ActorInput = {
  firstName: string; firstNameEn: string; firstNameHy: string;
  lastName: string; lastNameEn: string; lastNameHy: string;
  role: string; roleEn: string; roleHy: string;
  photo: string;
};
type SceneInput = {
  title: string; titleEn: string; titleHy: string;
  description: string; descriptionEn: string; descriptionHy: string;
  placement: string; placementEn: string; placementHy: string;
};

function str(fd: FormData, key: string) {
  return String(fd.get(key) || "").trim();
}
function int(fd: FormData, key: string) {
  const n = parseInt(String(fd.get(key) || ""), 10);
  return Number.isFinite(n) ? n : 0;
}
function date(fd: FormData, key: string): Date | null {
  const v = str(fd, key);
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}
function jsonArray<T>(fd: FormData, key: string): T[] {
  try {
    const a = JSON.parse(String(fd.get(key) || "[]"));
    return Array.isArray(a) ? a : [];
  } catch {
    return [];
  }
}

// sortOrder is SUPERADMIN-only (see design decision 9): Publishers must not
// be able to push their own films to the top of the catalog. When
// `includeSortOrder` is false we set it to `undefined`, which Prisma treats
// as "omit this field" — the DB default (create) / existing value (update)
// is preserved.
function buildData(fd: FormData, includeSortOrder: boolean) {
  const gallery = jsonArray<string>(fd, "gallery");
  const platforms = fd.getAll("platforms").map(String);
  const poster = str(fd, "poster");
  const price = str(fd, "price");
  const currency = str(fd, "currency");

  return {
    titleRu: str(fd, "titleRu"),
    titleEn: str(fd, "titleEn"),
    titleHy: str(fd, "titleHy"),
    genreRu: str(fd, "genreRu"),
    genreEn: str(fd, "genreEn"),
    genreHy: str(fd, "genreHy"),
    descriptionRu: str(fd, "descriptionRu"),
    descriptionEn: str(fd, "descriptionEn"),
    descriptionHy: str(fd, "descriptionHy"),
    placementTypeRu: str(fd, "placementTypeRu"),
    placementTypeEn: str(fd, "placementTypeEn"),
    placementTypeHy: str(fd, "placementTypeHy"),
    poster: poster || null,
    gallery: JSON.stringify(gallery),
    price: price || null,
    currency: currency || null,
    slotsTotal: int(fd, "slotsTotal"),
    slotsAvailable: int(fd, "slotsAvailable"),
    releaseDate: date(fd, "releaseDate"),
    platforms: JSON.stringify(platforms),
    bookingDeadline: date(fd, "bookingDeadline"),
    sortOrder: includeSortOrder ? int(fd, "sortOrder") : undefined,
    isActive: fd.get("isActive") === "on",
  };
}

// Mirrors the raw submitted FormData back into ProjectFormValues, so a failed
// validation can be returned alongside the error without losing anything the
// user typed (Task #11 — validation errors were wiping the whole form).
function extractValues(fd: FormData): ProjectFormValues {
  return {
    titleRu: str(fd, "titleRu"),
    titleEn: str(fd, "titleEn"),
    titleHy: str(fd, "titleHy"),
    genreRu: str(fd, "genreRu"),
    genreEn: str(fd, "genreEn"),
    genreHy: str(fd, "genreHy"),
    descriptionRu: str(fd, "descriptionRu"),
    descriptionEn: str(fd, "descriptionEn"),
    descriptionHy: str(fd, "descriptionHy"),
    placementTypeRu: str(fd, "placementTypeRu"),
    placementTypeEn: str(fd, "placementTypeEn"),
    placementTypeHy: str(fd, "placementTypeHy"),
    price: str(fd, "price"),
    currency: str(fd, "currency"),
    slotsTotal: int(fd, "slotsTotal"),
    slotsAvailable: int(fd, "slotsAvailable"),
    releaseDate: str(fd, "releaseDate"),
    bookingDeadline: str(fd, "bookingDeadline"),
    platforms: fd.getAll("platforms").map(String),
    sortOrder: int(fd, "sortOrder"),
    isActive: fd.get("isActive") === "on",
    actors: jsonArray<ActorInput>(fd, "actors"),
    scenes: jsonArray<SceneInput>(fd, "scenes"),
  };
}

function nestedActors(fd: FormData) {
  return jsonArray<ActorInput>(fd, "actors").map((a, i) => ({
    firstName: (a.firstName || "").trim(),
    firstNameEn: (a.firstNameEn || "").trim(),
    firstNameHy: (a.firstNameHy || "").trim(),
    lastName: (a.lastName || "").trim(),
    lastNameEn: (a.lastNameEn || "").trim(),
    lastNameHy: (a.lastNameHy || "").trim(),
    role: (a.role || "").trim(),
    roleEn: (a.roleEn || "").trim(),
    roleHy: (a.roleHy || "").trim(),
    photo: (a.photo || "").trim() || null,
    sortOrder: i,
  }));
}
function nestedScenes(fd: FormData) {
  return jsonArray<SceneInput>(fd, "scenes").map((s, i) => ({
    title: (s.title || "").trim(),
    titleEn: (s.titleEn || "").trim(),
    titleHy: (s.titleHy || "").trim(),
    description: (s.description || "").trim(),
    descriptionEn: (s.descriptionEn || "").trim(),
    descriptionHy: (s.descriptionHy || "").trim(),
    placement: (s.placement || "").trim(),
    placementEn: (s.placementEn || "").trim(),
    placementHy: (s.placementHy || "").trim(),
    sortOrder: i,
  }));
}

// ── Trilingual validation (design decision 7): RU/EN/HY must all be filled
// on every translatable field of the Project and its Scenes/Actors before a
// save is allowed, for both SUPERADMIN and PUBLISHER.
function fieldBlank(obj: object, key: string): boolean {
  const v = (obj as Record<string, unknown>)[key];
  return typeof v !== "string" || v.trim() === "";
}

const PROJECT_TRIPLE_FIELDS: Array<[string, string]> = [
  ["title", "Title"],
  ["genre", "Genre"],
  ["description", "Description"],
  ["placementType", "Placement type"],
];
const ACTOR_TRIPLE_FIELDS: Array<[string, string]> = [
  ["firstName", "First name"],
  ["lastName", "Last name"],
  ["role", "Role"],
];
const SCENE_TRIPLE_FIELDS: Array<[string, string]> = [
  ["title", "Title"],
  ["description", "Description"],
  ["placement", "Placement"],
];

function validateProjectTranslations(data: ReturnType<typeof buildData>): string | null {
  for (const [field, label] of PROJECT_TRIPLE_FIELDS) {
    for (const suffix of ["Ru", "En", "Hy"] as const) {
      if (fieldBlank(data, `${field}${suffix}`)) {
        return `${label} (${suffix.toUpperCase()}) is required — RU/EN/HY must all be filled.`;
      }
    }
  }
  return null;
}

function validateActorTranslations(actors: ReturnType<typeof nestedActors>): string | null {
  for (let i = 0; i < actors.length; i++) {
    for (const [field, label] of ACTOR_TRIPLE_FIELDS) {
      for (const suffix of ["", "En", "Hy"] as const) {
        if (fieldBlank(actors[i], `${field}${suffix}`)) {
          return `Cast member #${i + 1}: ${label} (${suffix ? suffix.toUpperCase() : "RU"}) is required — RU/EN/HY must all be filled.`;
        }
      }
    }
  }
  return null;
}

function validateSceneTranslations(scenes: ReturnType<typeof nestedScenes>): string | null {
  for (let i = 0; i < scenes.length; i++) {
    for (const [field, label] of SCENE_TRIPLE_FIELDS) {
      for (const suffix of ["", "En", "Hy"] as const) {
        if (fieldBlank(scenes[i], `${field}${suffix}`)) {
          return `Scene #${i + 1}: ${label} (${suffix ? suffix.toUpperCase() : "RU"}) is required — RU/EN/HY must all be filled.`;
        }
      }
    }
  }
  return null;
}

export async function createProject(
  _prev: ProjectFormState,
  fd: FormData,
): Promise<ProjectFormState> {
  const user = await requireUser();
  const isSuperadmin = user.role === "SUPERADMIN";

  const data = buildData(fd, isSuperadmin);
  if (!data.titleRu) return { error: "Title (RU) is required.", values: extractValues(fd) };

  const actors = nestedActors(fd);
  const scenes = nestedScenes(fd);
  const translationError =
    validateProjectTranslations(data) ??
    validateActorTranslations(actors) ??
    validateSceneTranslations(scenes);
  if (translationError) return { error: translationError, values: extractValues(fd) };

  await prisma.project.create({
    data: {
      ...data,
      // ownerId is always the creating user — never trusted from the form
      // (design decision: "New project" force-sets ownerId, publishes
      // immediately with no moderation).
      ownerId: user.id,
      actors: { create: actors },
      scenes: { create: scenes },
    },
  });
  revalidatePath("/admin/projects");
  revalidatePath("/");
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
  // 404 (not 403) for both "doesn't exist" and "not yours" — a Publisher
  // must not be able to distinguish the two, matching requireSuperadmin().
  if (!existing) notFound();
  if (!isSuperadmin && existing.ownerId !== user.id) notFound();

  const data = buildData(fd, isSuperadmin);
  if (!data.titleRu) return { error: "Title (RU) is required.", values: extractValues(fd) };

  const actors = nestedActors(fd);
  const scenes = nestedScenes(fd);
  const translationError =
    validateProjectTranslations(data) ??
    validateActorTranslations(actors) ??
    validateSceneTranslations(scenes);
  if (translationError) return { error: translationError, values: extractValues(fd) };

  await prisma.project.update({
    where: { id },
    data: {
      ...data,
      // Scenes/Actors have no standalone CRUD — they're always replaced
      // together with their parent Project, so the ownership check above
      // (requireUser + Project.ownerId) is the single enforcement point for
      // nested-resource authz.
      actors: { deleteMany: {}, create: actors },
      scenes: { deleteMany: {}, create: scenes },
    },
  });
  revalidatePath("/admin/projects");
  revalidatePath("/");
  revalidatePath(`/projects/${id}`);
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
  revalidatePath("/admin/projects");
  revalidatePath("/");
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
  revalidatePath("/admin/projects");
  revalidatePath("/");
}
