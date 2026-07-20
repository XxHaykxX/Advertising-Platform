import "server-only";
import { prisma } from "@/lib/prisma";

// Shared (auth-free) helper: every place an /uploads/… path can be referenced
// in the DB, so neither the staff delete (uploads.ts) nor the member delete
// (member-uploads.ts) ever removes a file that's still in use (which would 404
// on the live site). The caller does its own auth gate first. Returns
// human-readable labels of what references it — empty means safe to delete.
export async function findUploadUsage(publicPath: string): Promise<string[]> {
  const used: string[] = [];

  const projects = await prisma.project.findMany({
    // gallery is a JSON string[] stored as TEXT — `contains` = LIKE %path%; the
    // path (timestamp + uuid) is unique enough that a substring hit is real.
    where: { OR: [{ poster: publicPath }, { gallery: { contains: publicPath } }] },
    select: { title: true },
    take: 25,
  });
  for (const p of projects) used.push(`Project: ${p.title}`);

  const actors = await prisma.actor.findMany({ where: { photo: publicPath }, select: { name: true }, take: 25 });
  for (const a of actors) used.push(`Cast/crew: ${a.name}`);

  const portfolios = await prisma.portfolio.findMany({ where: { image: publicPath }, select: { title: true }, take: 25 });
  for (const p of portfolios) used.push(`Portfolio: ${p.title}`);

  const partners = await prisma.partner.findMany({ where: { logo: publicPath }, select: { name: true }, take: 25 });
  for (const p of partners) used.push(`Partner: ${p.name}`);

  const avatarCount = await prisma.user.count({ where: { avatar: publicPath } });
  if (avatarCount > 0) used.push(`User avatar${avatarCount > 1 ? ` (×${avatarCount})` : ""}`);

  return used;
}
