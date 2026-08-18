"use server";

import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth/require";
import { recordVersion } from "@/lib/history/record";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";
import { safeUploadPath } from "@/lib/uploads-path";

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

export type PartnerFormState = {
  error?: string;
  values?: PartnerFormValues;
  // Success is REPORTED, not acted on: the action must not call redirect()
  // itself. See the comment on the redirect contract below.
  ok?: boolean;
  redirect?: string;
};

function buildData(fd: FormData): PartnerFormValues {
  return {
    name: str(fd, "name", VARCHAR_MAX),
    logo: safeUploadPath(str(fd, "logo", VARCHAR_MAX)),
    url: str(fd, "url", VARCHAR_MAX),
  };
}

function validate(data: PartnerFormValues, t: ReturnType<typeof makeUI>): string | null {
  if (!data.name) return t("formErr.company");
  return null;
}

function revalidatePartnerPaths() {
  revalidatePath("/admin/partners");
  // Two public pages render partners: /about (PartnersMarquee — the card grid
  // was dropped 2026-07-30) and, since 2026-08-18, the homepage, which shows
  // the same marquee as its "channels we work with" section. "/" was dropped
  // from this list once for rendering no partners at all; it does now, and
  // without it staff edits a logo, sees the homepage unchanged and reads that
  // as the save having failed.
  //
  // Both are literal paths, so `type` stays omitted and only those two pages
  // are marked — NOT revalidatePath("/", "layout"), which reseeds the whole
  // tree from the root layout down and is what broke the project form on
  // 2026-07-15 (see revalidateProjectPaths in ../projects/actions.ts).
  //
  // Note that any revalidatePath from a Server Function currently also
  // refreshes previously visited pages on next navigation (Next docs, "Good to
  // know") — that cost is already paid by the /about call and does not grow by
  // adding a second literal path. Both pages live under the PUBLIC root layout
  // while this action runs under the admin panel layout, and revalidating
  // across that boundary is what makes the redirect contract below mandatory.
  revalidatePath("/about");
  revalidatePath("/");
}

/* Why these actions return { ok, redirect } instead of calling redirect():
 *
 * redirect() inside the action makes Next answer the POST with 303 plus an RSC
 * payload for the destination. Because the action revalidated a path in another
 * layout branch (/about, and before that "/"), that payload carries the whole
 * tree from the public root layout down — and on production its
 * client-reference entries point at chunk files the build never emitted:
 *
 *   2:I[85820,["/_next/static/chunks/3nyd3uho56p0l.js", …],"DocumentLanguage"]
 *
 * Each 404s, the Turbopack runtime raises ChunkLoadError, and the admin error
 * boundary renders "Что-то пошло не так" — even though the save itself already
 * succeeded. Captured live on 2026-07-30: a plain RSC GET of the same route
 * returns working chunk names; the action's 303 does not. A clean rebuild, a
 * server cache purge and a Node restart all left it unchanged.
 *
 * Returning the destination instead means the client navigates with a full page
 * load, so the broken payload is never requested. Same contract the project
 * form has used since the 2026-07-15 black-screen fix — that fix landed there
 * and was never carried over here. */

export async function createPartner(
  _prev: PartnerFormState,
  fd: FormData,
): Promise<PartnerFormState> {
  const user = await requireSuperadmin();
  const t = makeUI(await getLocale());
  const data = buildData(fd);
  const error = validate(data, t);
  if (error) return { error, values: data };

  // Position is owned by the list (drag-and-drop, 2026-07-27), not by a field —
  // a new partner lands at the end of the strip.
  const max = await prisma.partner.aggregate({ _max: { sortOrder: true } });

  const created = await prisma.partner.create({
    data: {
      name: data.name,
      logo: data.logo || null,
      url: data.url || null,
      sortOrder: (max._max.sortOrder ?? 0) + 1,
    },
  });
  await recordVersion(prisma, "Partner", created.id, "CREATE", { id: user.id, name: user.name });

  revalidatePartnerPaths();
  return { ok: true, redirect: "/admin/partners" };
}

export async function updatePartner(
  id: number,
  _prev: PartnerFormState,
  fd: FormData,
): Promise<PartnerFormState> {
  const user = await requireSuperadmin();
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
  await recordVersion(prisma, "Partner", id, "UPDATE", { id: user.id, name: user.name });

  revalidatePartnerPaths();
  return { ok: true, redirect: "/admin/partners" };
}

export async function deletePartner(id: number) {
  const user = await requireSuperadmin();
  // Before the delete — there is nothing left to snapshot afterwards.
  await recordVersion(prisma, "Partner", id, "DELETE", { id: user.id, name: user.name });
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
