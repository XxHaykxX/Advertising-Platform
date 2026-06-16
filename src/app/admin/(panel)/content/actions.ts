"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CONTENT_KEYS } from "@/lib/content-keys";

export type SaveState = { ok?: boolean };

export async function saveContent(
  _prev: SaveState,
  fd: FormData,
): Promise<SaveState> {
  for (const item of CONTENT_KEYS) {
    const ru = String(fd.get(`ru:${item.key}`) ?? "").trim();
    const en = String(fd.get(`en:${item.key}`) ?? "").trim();
    const hy = String(fd.get(`hy:${item.key}`) ?? "").trim();
    await prisma.content.upsert({
      where: { key: item.key },
      update: { ru, en, hy },
      create: { key: item.key, ru, en, hy },
    });
  }
  revalidatePath("/");
  revalidatePath("/admin/content");
  return { ok: true };
}
