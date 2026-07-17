"use server";

import { revalidatePath } from "next/cache";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth/require";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";

// MySQL caps a plain (non-@db.Text) Prisma String column at VarChar(191);
// anything longer throws an unhandled P2000 ("value too long"). Truncate at
// the form-parsing boundary so a save always succeeds instead of 500ing.
const VARCHAR_MAX = 191;

function str(fd: FormData, key: string, maxLen?: number) {
  const v = String(fd.get(key) || "").trim();
  return maxLen ? v.slice(0, maxLen) : v;
}
function int(fd: FormData, key: string, fallback = 0) {
  const n = parseInt(String(fd.get(key) || ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

export type PartnerFormValues = {
  name: string;
  logo: string;
  url: string;
  sortOrder: number;
};

export type PartnerFormState = { error?: string; values?: PartnerFormValues };

function buildData(fd: FormData): PartnerFormValues {
  return {
    name: str(fd, "name", VARCHAR_MAX),
    logo: str(fd, "logo", VARCHAR_MAX),
    url: str(fd, "url", VARCHAR_MAX),
    sortOrder: int(fd, "sortOrder"),
  };
}

function validate(data: PartnerFormValues, t: ReturnType<typeof makeUI>): string | null {
  if (!data.name) return t("formErr.company");
  return null;
}

function revalidatePartnerPaths() {
  revalidatePath("/admin/partners");
  revalidatePath("/partners");
  revalidatePath("/");
}

export async function createPartner(
  _prev: PartnerFormState,
  fd: FormData,
): Promise<PartnerFormState> {
  await requireSuperadmin();
  const t = makeUI(await getLocale());
  const data = buildData(fd);
  const error = validate(data, t);
  if (error) return { error, values: data };

  await prisma.partner.create({
    data: {
      name: data.name,
      logo: data.logo || null,
      url: data.url || null,
      sortOrder: data.sortOrder,
    },
  });

  revalidatePartnerPaths();
  redirect("/admin/partners");
}

export async function updatePartner(
  id: number,
  _prev: PartnerFormState,
  fd: FormData,
): Promise<PartnerFormState> {
  await requireSuperadmin();
  const t = makeUI(await getLocale());

  const existing = await prisma.partner.findUnique({ where: { id }, select: { id: true } });
  if (!existing) notFound();

  const data = buildData(fd);
  const error = validate(data, t);
  if (error) return { error, values: data };

  await prisma.partner.update({
    where: { id },
    data: {
      name: data.name,
      logo: data.logo || null,
      url: data.url || null,
      sortOrder: data.sortOrder,
    },
  });

  revalidatePartnerPaths();
  redirect("/admin/partners");
}

export async function deletePartner(id: number) {
  await requireSuperadmin();
  await prisma.partner.delete({ where: { id } }).catch(() => null);
  revalidatePartnerPaths();
}
