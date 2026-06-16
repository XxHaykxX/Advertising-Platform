import "server-only";
import { prisma } from "@/lib/prisma";
import type { ContactsDTO } from "@/lib/types";

/** All settings as a key→value map. */
export async function getSettings(): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function getContacts(): Promise<ContactsDTO> {
  const s = await getSettings();
  return {
    phone: s.contact_phone ?? "",
    email: s.contact_email ?? "",
    whatsapp: s.contact_whatsapp ?? "",
    telegram: s.contact_telegram ?? "",
    instagram: s.social_instagram ?? "",
    youtube: s.social_youtube ?? "",
  };
}
