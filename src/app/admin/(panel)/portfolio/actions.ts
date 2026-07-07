"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth/require";

export type FormState = { error?: string };

function str(fd: FormData, key: string) {
  return String(fd.get(key) || "").trim();
}
function int(fd: FormData, key: string) {
  const n = parseInt(String(fd.get(key) || ""), 10);
  return Number.isFinite(n) ? n : 0;
}
function images(fd: FormData): string[] {
  try {
    const a = JSON.parse(String(fd.get("images") || "[]"));
    return Array.isArray(a) ? a.map(String) : [];
  } catch {
    return [];
  }
}
function publisherId(fd: FormData): number | null {
  const raw = str(fd, "publisherId");
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

function buildData(fd: FormData) {
  const videoType = str(fd, "videoType") === "file" ? "file" : "youtube";
  return {
    titleRu: str(fd, "titleRu"),
    titleEn: str(fd, "titleEn"),
    titleHy: str(fd, "titleHy"),
    descriptionRu: str(fd, "descriptionRu"),
    descriptionEn: str(fd, "descriptionEn"),
    descriptionHy: str(fd, "descriptionHy"),
    images: JSON.stringify(images(fd)),
    videoType,
    videoUrl: str(fd, "videoUrl") || null,
    videoFile: str(fd, "videoFile") || null,
    sortOrder: int(fd, "sortOrder"),
    publisherId: publisherId(fd),
  };
}

export async function createPortfolio(_p: FormState, fd: FormData): Promise<FormState> {
  await requireSuperadmin();
  const data = buildData(fd);
  if (!data.titleRu) return { error: "Title (RU) is required." };
  await prisma.portfolio.create({ data });
  revalidatePath("/admin/portfolio");
  revalidatePath("/");
  redirect("/admin/portfolio");
}

export async function updatePortfolio(id: number, _p: FormState, fd: FormData): Promise<FormState> {
  await requireSuperadmin();
  const data = buildData(fd);
  if (!data.titleRu) return { error: "Title (RU) is required." };
  await prisma.portfolio.update({ where: { id }, data });
  revalidatePath("/admin/portfolio");
  revalidatePath("/");
  redirect("/admin/portfolio");
}

export async function deletePortfolio(id: number) {
  await requireSuperadmin();
  await prisma.portfolio.delete({ where: { id } });
  revalidatePath("/admin/portfolio");
  revalidatePath("/");
}
