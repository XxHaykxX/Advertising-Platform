"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth/require";

export type SaveState = { ok?: boolean };

const KEYS = [
  "contact_phone",
  "contact_email",
  "contact_whatsapp",
  "contact_telegram",
  "social_instagram",
  "social_youtube",
];

export async function saveContacts(
  _prev: SaveState,
  fd: FormData,
): Promise<SaveState> {
  await requireSuperadmin();
  for (const key of KEYS) {
    const value = String(fd.get(key) ?? "").trim();
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
  revalidatePath("/");
  revalidatePath("/admin/settings");
  return { ok: true };
}
