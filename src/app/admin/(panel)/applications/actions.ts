"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAppStatus } from "@/lib/data/applications";
import { requireSuperadmin } from "@/lib/auth/require";

export async function setStatus(id: number, status: string) {
  // Server Actions are reachable via direct POST, not just through the UI —
  // re-verify authz here even though the page is already guarded.
  await requireSuperadmin();
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
  await requireSuperadmin();
  const note = String(formData.get("note") || "").trim();
  await prisma.application.update({
    where: { id },
    data: { note: note || null },
  });
  revalidatePath(`/admin/applications/${id}`);
  return { ok: true };
}
