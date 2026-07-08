"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth/require";

export const APP_STATUSES = ["new", "in_progress", "closed"] as const;
export type AppStatus = (typeof APP_STATUSES)[number];

export function isAppStatus(value: string): value is AppStatus {
  return (APP_STATUSES as readonly string[]).includes(value);
}

export async function setApplicationStatus(id: number, status: string) {
  // Server Actions are reachable via direct POST, not just through the UI —
  // re-verify authz here even though the page is already guarded.
  await requireSuperadmin();
  if (!isAppStatus(status)) return;
  await prisma.application.update({ where: { id }, data: { status } });
  revalidatePath("/admin/applications");
  revalidatePath("/admin");
}
