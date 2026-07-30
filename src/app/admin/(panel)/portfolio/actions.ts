"use server";

import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
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

export type PortfolioFormValues = {
  // Legacy base columns — the form no longer submits generic title/description
  // fields (#41); they're derived from the per-locale ones below and kept as
  // the ultimate fallback in the data layer (see getPortfolio's pickLocale).
  title: string;
  description: string;
  brand: string;
  image: string;
  metrics: string; // JSON object, built by the MetricsEditor's hidden input
  // ── Per-locale translations (#41) — mirror Project's titleHy/synopsisHy set ──
  titleHy: string;
  titleRu: string;
  titleEn: string;
  descriptionHy: string;
  descriptionRu: string;
  descriptionEn: string;
};

export type PortfolioFormState = {
  error?: string;
  values?: PortfolioFormValues;
  // Success is reported, never acted on here — the action must not call
  // redirect(). Same contract and same reason as the partner form: see the
  // redirect-contract comment in ../partners/actions.ts.
  ok?: boolean;
  redirect?: string;
};

function buildData(fd: FormData): PortfolioFormValues {
  // The form only submits the per-locale fields — derive the legacy
  // title/description columns from them (hy → ru → en priority, same as the
  // project form) so the base fallback stays populated. Was ru-first, which
  // made an Armenian-only rename invisible wherever the legacy column is
  // rendered — see the 2026-07-30 fix in ../projects/actions.ts.
  const titleHy = str(fd, "titleHy", VARCHAR_MAX);
  const titleRu = str(fd, "titleRu", VARCHAR_MAX);
  const titleEn = str(fd, "titleEn", VARCHAR_MAX);
  const descriptionHy = str(fd, "descriptionHy");
  const descriptionRu = str(fd, "descriptionRu");
  const descriptionEn = str(fd, "descriptionEn");
  return {
    title: (titleHy || titleRu || titleEn).slice(0, VARCHAR_MAX),
    description: descriptionHy || descriptionRu || descriptionEn,
    brand: str(fd, "brand", VARCHAR_MAX),
    image: str(fd, "image", VARCHAR_MAX),
    metrics: str(fd, "metrics"),
    titleHy,
    titleRu,
    titleEn,
    descriptionHy,
    descriptionRu,
    descriptionEn,
  };
}

/** Validates required fields and, if `metrics` is non-empty, that it parses
   as a JSON object (not array/scalar) — matches the DTO's documented shape
   `{"views":"2.1M","recall":"+38%"}`. Returns the parsed-and-reserialized
   JSON string on success (`null` on failure/empty). */
function validateMetrics(
  raw: string,
  t: ReturnType<typeof makeUI>,
): { error?: string; json: string | null } {
  if (!raw) return { json: null };
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return { error: t("formErr.metricsNotObject"), json: null };
    }
    return { json: JSON.stringify(parsed) };
  } catch {
    return { error: t("formErr.metricsNotJson"), json: null };
  }
}

function validate(data: PortfolioFormValues): string | null {
  if (!data.title) return "Enter a title in at least one language.";
  if (!data.brand) return "Brand is required.";
  if (!data.description) return "Enter a description in at least one language.";
  return null;
}

function revalidatePortfolioPaths() {
  revalidatePath("/admin/portfolio");
  revalidatePath("/portfolio");
}

export async function createPortfolio(
  _prev: PortfolioFormState,
  fd: FormData,
): Promise<PortfolioFormState> {
  await requireSuperadmin();
  const t = makeUI(await getLocale());
  const data = buildData(fd);

  const fieldError = validate(data);
  if (fieldError) return { error: fieldError, values: data };

  const { error: metricsError, json: metrics } = validateMetrics(data.metrics, t);
  if (metricsError) return { error: metricsError, values: data };

  // Position is owned by the list (drag-and-drop), not by a field — a new case
  // lands at the end, one past the current maximum.
  const max = await prisma.portfolio.aggregate({ _max: { sortOrder: true } });

  await prisma.portfolio.create({
    data: {
      title: data.title,
      titleHy: data.titleHy,
      titleRu: data.titleRu,
      titleEn: data.titleEn,
      brand: data.brand,
      description: data.description,
      descriptionHy: data.descriptionHy || null,
      descriptionRu: data.descriptionRu || null,
      descriptionEn: data.descriptionEn || null,
      image: data.image || null,
      metrics,
      sortOrder: (max._max.sortOrder ?? 0) + 1,
    },
  });

  revalidatePortfolioPaths();
  return { ok: true, redirect: "/admin/portfolio" };
}

export async function updatePortfolio(
  id: number,
  _prev: PortfolioFormState,
  fd: FormData,
): Promise<PortfolioFormState> {
  await requireSuperadmin();
  const t = makeUI(await getLocale());

  const existing = await prisma.portfolio.findUnique({ where: { id }, select: { id: true } });
  if (!existing) notFound();

  const data = buildData(fd);
  const fieldError = validate(data);
  if (fieldError) return { error: fieldError, values: data };

  const { error: metricsError, json: metrics } = validateMetrics(data.metrics, t);
  if (metricsError) return { error: metricsError, values: data };

  await prisma.portfolio.update({
    where: { id },
    data: {
      title: data.title,
      titleHy: data.titleHy,
      titleRu: data.titleRu,
      titleEn: data.titleEn,
      brand: data.brand,
      description: data.description,
      descriptionHy: data.descriptionHy || null,
      descriptionRu: data.descriptionRu || null,
      descriptionEn: data.descriptionEn || null,
      image: data.image || null,
      metrics,
      // sortOrder deliberately absent: editing a case must not move it. The
      // order is set by dragging in the list (reorderPortfolio below).
    },
  });

  revalidatePortfolioPaths();
  return { ok: true, redirect: "/admin/portfolio" };
}

export async function deletePortfolio(id: number) {
  await requireSuperadmin();
  await prisma.portfolio.delete({ where: { id } }).catch(() => null);
  revalidatePortfolioPaths();
}

/** Persist the whole case-study order in one go — the list is dragged as a
 *  sequence, so writing every row's position keeps it unambiguous even if two
 *  rows previously shared a number. Same shape as reorderProjects. */
export async function reorderPortfolio(orderedIds: number[]) {
  await requireSuperadmin();
  if (orderedIds.length === 0) return;
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.portfolio.update({ where: { id }, data: { sortOrder: index } }),
    ),
  );
  revalidatePortfolioPaths();
}
