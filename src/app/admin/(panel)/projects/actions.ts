"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export type ProjectFormState = { error?: string };

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

function buildData(fd: FormData) {
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
    sortOrder: int(fd, "sortOrder"),
    isActive: fd.get("isActive") === "on",
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

export async function createProject(
  _prev: ProjectFormState,
  fd: FormData,
): Promise<ProjectFormState> {
  const data = buildData(fd);
  if (!data.titleRu) return { error: "Название (RU) обязательно." };

  await prisma.project.create({
    data: {
      ...data,
      actors: { create: nestedActors(fd) },
      scenes: { create: nestedScenes(fd) },
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
  const data = buildData(fd);
  if (!data.titleRu) return { error: "Название (RU) обязательно." };

  await prisma.project.update({
    where: { id },
    data: {
      ...data,
      actors: { deleteMany: {}, create: nestedActors(fd) },
      scenes: { deleteMany: {}, create: nestedScenes(fd) },
    },
  });
  revalidatePath("/admin/projects");
  revalidatePath("/");
  revalidatePath(`/projects/${id}`);
  redirect("/admin/projects");
}

export async function deleteProject(id: number) {
  await prisma.project.delete({ where: { id } });
  revalidatePath("/admin/projects");
  revalidatePath("/");
}

export async function toggleActive(id: number, isActive: boolean) {
  await prisma.project.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/projects");
  revalidatePath("/");
}
