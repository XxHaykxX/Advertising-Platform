"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isLocale } from "@/lib/i18n";

export type SaveLangState = { ok?: boolean; error?: string };

export async function saveDefaultLang(
  _prev: SaveLangState,
  fd: FormData,
): Promise<SaveLangState> {
  const value = String(fd.get("default_lang") ?? "").trim();
  if (!isLocale(value)) return { error: "Недопустимое значение языка." };

  await prisma.setting.upsert({
    where: { key: "default_lang" },
    update: { value },
    create: { key: "default_lang", value },
  });

  // Revalidate public pages and admin so the new default language is picked up
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  return { ok: true };
}
