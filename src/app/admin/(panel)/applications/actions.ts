"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAppStatus } from "@/lib/data/applications";

export async function setStatus(id: number, status: string) {
  if (!isAppStatus(status)) return;
  await prisma.application.update({ where: { id }, data: { status } });
  revalidatePath("/admin/applications");
  revalidatePath(`/admin/applications/${id}`);
  revalidatePath("/admin");
}

export type NoteState = { ok?: boolean };

export async function saveNote(
  id: number,
  _prev: NoteState,
  formData: FormData,
): Promise<NoteState> {
  const note = String(formData.get("note") || "").trim();
  await prisma.application.update({
    where: { id },
    data: { note: note || null },
  });
  revalidatePath(`/admin/applications/${id}`);
  return { ok: true };
}
