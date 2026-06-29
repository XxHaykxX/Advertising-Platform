import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let projects: { id: number; createdAt: Date }[] = [];
  try {
    projects = await prisma.project.findMany({
      where: { isActive: true },
      select: { id: true, createdAt: true },
    });
  } catch {
    // DB unavailable at build time → ship a minimal sitemap.
  }

  return [
    { url: BASE, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/catalog`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/how-it-works`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/portfolio`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/partners`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/contact`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/consent`, changeFrequency: "yearly", priority: 0.3 },
    ...projects.map((p) => ({
      url: `${BASE}/projects/${p.id}`,
      lastModified: p.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
