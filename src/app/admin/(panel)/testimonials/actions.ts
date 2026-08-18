"use server";

import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth/require";
import { recordVersion } from "@/lib/history/record";
import { safeUploadPath } from "@/lib/uploads-path";

// MySQL caps a plain (non-@db.Text) Prisma String column at VarChar(191);
// anything longer throws an unhandled P2000 ("value too long"). Truncate at
// the form-parsing boundary so a save always succeeds instead of 500ing.
// Mirrors portfolio/actions.ts.
const VARCHAR_MAX = 191;

function str(fd: FormData, key: string, maxLen?: number) {
  const v = String(fd.get(key) || "").trim();
  return maxLen ? v.slice(0, maxLen) : v;
}

export type TestimonialFormValues = {
  video: string;
  image: string;
  avatar: string;
  authorName: string;
  authorRole: string;
  company: string;
  quoteHy: string;
  quoteRu: string;
  quoteEn: string;
};

export type TestimonialFormState = {
  error?: string;
  values?: TestimonialFormValues;
  // Success is reported, never acted on here — the action must not call
  // redirect(). Same contract as ../portfolio/actions.ts.
  ok?: boolean;
  redirect?: string;
};

function buildData(fd: FormData): TestimonialFormValues {
  return {
    video: safeUploadPath(str(fd, "video", VARCHAR_MAX)),
    image: safeUploadPath(str(fd, "image", VARCHAR_MAX)),
    avatar: safeUploadPath(str(fd, "avatar", VARCHAR_MAX)),
    authorName: str(fd, "authorName", VARCHAR_MAX),
    authorRole: str(fd, "authorRole", VARCHAR_MAX),
    company: str(fd, "company", VARCHAR_MAX),
    quoteHy: str(fd, "quoteHy"),
    quoteRu: str(fd, "quoteRu"),
    quoteEn: str(fd, "quoteEn"),
  };
}

function validate(data: TestimonialFormValues): string | null {
  if (!data.authorName) return "Author name is required.";
  if (!data.quoteHy && !data.quoteRu && !data.quoteEn) return "Enter a quote in at least one language.";
  return null;
}

function revalidateTestimonialPaths() {
  revalidatePath("/admin/testimonials");
  // The homepage carousel is the only public place these render.
  revalidatePath("/");
}

export async function createTestimonial(
  _prev: TestimonialFormState,
  fd: FormData,
): Promise<TestimonialFormState> {
  const user = await requireSuperadmin();
  const data = buildData(fd);

  const fieldError = validate(data);
  if (fieldError) return { error: fieldError, values: data };

  // Position is owned by the list (drag-and-drop), not by a field — a new
  // testimonial lands at the end, one past the current maximum.
  const max = await prisma.testimonial.aggregate({ _max: { sortOrder: true } });

  const created = await prisma.testimonial.create({
    data: {
      video: data.video || null,
      image: data.image || null,
      avatar: data.avatar || null,
      authorName: data.authorName,
      authorRole: data.authorRole || null,
      company: data.company || null,
      quoteHy: data.quoteHy || null,
      quoteRu: data.quoteRu || null,
      quoteEn: data.quoteEn || null,
      sortOrder: (max._max.sortOrder ?? 0) + 1,
    },
  });
  await recordVersion(prisma, "Testimonial", created.id, "CREATE", { id: user.id, name: user.name });

  revalidateTestimonialPaths();
  return { ok: true, redirect: "/admin/testimonials" };
}

export async function updateTestimonial(
  id: number,
  _prev: TestimonialFormState,
  fd: FormData,
): Promise<TestimonialFormState> {
  const user = await requireSuperadmin();

  const existing = await prisma.testimonial.findUnique({ where: { id }, select: { id: true } });
  if (!existing) notFound();

  const data = buildData(fd);
  const fieldError = validate(data);
  if (fieldError) return { error: fieldError, values: data };

  await prisma.testimonial.update({
    where: { id },
    data: {
      video: data.video || null,
      image: data.image || null,
      avatar: data.avatar || null,
      authorName: data.authorName,
      authorRole: data.authorRole || null,
      company: data.company || null,
      quoteHy: data.quoteHy || null,
      quoteRu: data.quoteRu || null,
      quoteEn: data.quoteEn || null,
      // sortOrder deliberately absent: editing a testimonial must not move
      // it. The order is set by dragging in the list (reorderTestimonials).
    },
  });
  await recordVersion(prisma, "Testimonial", id, "UPDATE", { id: user.id, name: user.name });

  revalidateTestimonialPaths();
  return { ok: true, redirect: "/admin/testimonials" };
}

export async function deleteTestimonial(id: number) {
  const user = await requireSuperadmin();
  // Before the delete — there is nothing left to snapshot afterwards.
  await recordVersion(prisma, "Testimonial", id, "DELETE", { id: user.id, name: user.name });
  await prisma.testimonial.delete({ where: { id } }).catch(() => null);
  revalidateTestimonialPaths();
}

/** Persist the whole testimonial order in one go — same shape as
 *  reorderPortfolio. */
export async function reorderTestimonials(orderedIds: number[]) {
  await requireSuperadmin();
  if (orderedIds.length === 0) return;
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.testimonial.update({ where: { id }, data: { sortOrder: index } }),
    ),
  );
  revalidateTestimonialPaths();
}
