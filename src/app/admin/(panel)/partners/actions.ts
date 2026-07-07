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

function buildData(fd: FormData) {
  return {
    name: str(fd, "name"),
    logo: str(fd, "logo") || null,
    url: str(fd, "url") || null,
    sortOrder: int(fd, "sortOrder"),
  };
}

export async function createPartner(_p: FormState, fd: FormData): Promise<FormState> {
  await requireSuperadmin();
  const data = buildData(fd);
  if (!data.name) return { error: "Name is required." };
  await prisma.partner.create({ data });
  revalidatePath("/admin/partners");
  revalidatePath("/");
  redirect("/admin/partners");
}

export async function updatePartner(id: number, _p: FormState, fd: FormData): Promise<FormState> {
  await requireSuperadmin();
  const data = buildData(fd);
  if (!data.name) return { error: "Name is required." };
  await prisma.partner.update({ where: { id }, data });
  revalidatePath("/admin/partners");
  revalidatePath("/");
  redirect("/admin/partners");
}

export async function deletePartner(id: number) {
  await requireSuperadmin();
  await prisma.partner.delete({ where: { id } });
  revalidatePath("/admin/partners");
  revalidatePath("/");
}
