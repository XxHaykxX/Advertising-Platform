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

export type PartnerFormValues = {
  name: string;
  logo: string;
  url: string;
};

export type PartnerFormState = { error?: string; values?: PartnerFormValues };

function buildData(fd: FormData): PartnerFormValues {
  return {
    name: str(fd, "name", VARCHAR_MAX),
    logo: str(fd, "logo", VARCHAR_MAX),
    url: str(fd, "url", VARCHAR_MAX),
  };
}

function validate(data: PartnerFormValues, t: ReturnType<typeof makeUI>): string | null {
  if (!data.name) return t("formErr.company");
  return null;
}

function revalidatePartnerPaths() {
  revalidatePath("/admin/partners");
  // /about is the only page that renders partners (PartnersMarquee +
  // PartnersGrid). This used to revalidate "/partners" — a route that does not
  // exist — and "/", which renders no partners at all. Revalidating "/" is the
  // expensive, blast-radius-everything option: per the Next docs it "causes all
  // previously visited pages to refresh when navigated to again", and forcing a
  // reseed from the root layout down while a Server Action response is in
  // flight is exactly what broke the project form on 2026-07-15 (see the
  // comment on revalidateProjectPaths in ../projects/actions.ts).
  revalidatePath("/about");
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

  // Position is owned by the list (drag-and-drop, 2026-07-27), not by a field —
  // a new partner lands at the end of the strip.
  const max = await prisma.partner.aggregate({ _max: { sortOrder: true } });

  await prisma.partner.create({
    data: {
      name: data.name,
      logo: data.logo || null,
      url: data.url || null,
      sortOrder: (max._max.sortOrder ?? 0) + 1,
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
      // sortOrder deliberately absent: editing a partner must not move it in
      // the strip. Order is set by dragging in the list (reorderPartners).
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

/** Persist the whole partner order in one go — same shape and reasoning as
 *  reorderProjects / reorderPortfolio. */
export async function reorderPartners(orderedIds: number[]) {
  await requireSuperadmin();
  if (orderedIds.length === 0) return;
  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.partner.update({ where: { id }, data: { sortOrder: index } })),
  );
  revalidatePartnerPaths();
}
