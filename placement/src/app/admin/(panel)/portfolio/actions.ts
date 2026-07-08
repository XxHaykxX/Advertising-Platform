"use server";

import { revalidatePath } from "next/cache";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth/require";

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

export type PortfolioFormValues = {
  title: string;
  brand: string;
  description: string;
  image: string;
  metrics: string; // raw JSON text as typed in the form
  sortOrder: number;
};

export type PortfolioFormState = { error?: string; values?: PortfolioFormValues };

function buildData(fd: FormData): PortfolioFormValues {
  return {
    title: str(fd, "title", VARCHAR_MAX),
    brand: str(fd, "brand", VARCHAR_MAX),
    description: str(fd, "description"),
    image: str(fd, "image", VARCHAR_MAX),
    metrics: str(fd, "metrics"),
    sortOrder: int(fd, "sortOrder"),
  };
}

/** Validates required fields and, if `metrics` is non-empty, that it parses
   as a JSON object (not array/scalar) — matches the DTO's documented shape
   `{"views":"2.1M","recall":"+38%"}`. Returns the parsed-and-reserialized
   JSON string on success (`null` on failure/empty). */
function validateMetrics(raw: string): { error?: string; json: string | null } {
  if (!raw) return { json: null };
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return { error: "Metrics must be a JSON object, e.g. {\"views\":\"2.1M\"}." , json: null };
    }
    return { json: JSON.stringify(parsed) };
  } catch {
    return { error: "Metrics is not valid JSON.", json: null };
  }
}

function validate(data: PortfolioFormValues): string | null {
  if (!data.title) return "Title is required.";
  if (!data.brand) return "Brand is required.";
  if (!data.description) return "Description is required.";
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
  const data = buildData(fd);

  const fieldError = validate(data);
  if (fieldError) return { error: fieldError, values: data };

  const { error: metricsError, json: metrics } = validateMetrics(data.metrics);
  if (metricsError) return { error: metricsError, values: data };

  await prisma.portfolio.create({
    data: {
      title: data.title,
      brand: data.brand,
      description: data.description,
      image: data.image || null,
      metrics,
      sortOrder: data.sortOrder,
    },
  });

  revalidatePortfolioPaths();
  redirect("/admin/portfolio");
}

export async function updatePortfolio(
  id: number,
  _prev: PortfolioFormState,
  fd: FormData,
): Promise<PortfolioFormState> {
  await requireSuperadmin();

  const existing = await prisma.portfolio.findUnique({ where: { id }, select: { id: true } });
  if (!existing) notFound();

  const data = buildData(fd);
  const fieldError = validate(data);
  if (fieldError) return { error: fieldError, values: data };

  const { error: metricsError, json: metrics } = validateMetrics(data.metrics);
  if (metricsError) return { error: metricsError, values: data };

  await prisma.portfolio.update({
    where: { id },
    data: {
      title: data.title,
      brand: data.brand,
      description: data.description,
      image: data.image || null,
      metrics,
      sortOrder: data.sortOrder,
    },
  });

  revalidatePortfolioPaths();
  redirect("/admin/portfolio");
}

export async function deletePortfolio(id: number) {
  await requireSuperadmin();
  await prisma.portfolio.delete({ where: { id } }).catch(() => null);
  revalidatePortfolioPaths();
}
