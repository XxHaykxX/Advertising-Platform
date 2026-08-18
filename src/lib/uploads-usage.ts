import "server-only";
import { prisma } from "@/lib/prisma";
import type { HistoryEntity } from "@/lib/history/snapshot";

// Shared (auth-free) helper: every place an /uploads/… path can be referenced,
// either right now or in a saved version, so the media library can warn before
// a delete instead of just refusing it. The caller does its own auth gate
// first.

/** One live or historical reference to a file. `href` is null when there's
 *  nowhere in the admin to click through to (e.g. a staff/member avatar). */
export type UploadUsageRef = { label: string; href: string | null };

/** A past version that still mentions the file, even though nothing live
 *  does anymore. Restoring that version would put the reference back while
 *  the file itself stays gone — a broken image on the live site. */
export type UploadUsageHistoryRef = UploadUsageRef & {
  /** How many saved versions of this record still mention the file. */
  versions: number;
  /** Most recent of those versions, as epoch ms (Date over the RSC boundary
   *  would work too, but every other list in this codebase — MediaFile.mtime —
   *  already uses a number, so this matches that convention). */
  lastVersionAt: number;
};

export type UploadUsage = {
  /** Referenced by a live record right now — deleting the file breaks
   *  something visible on the site immediately. */
  current: UploadUsageRef[];
  /** Not referenced live, but still baked into one or more saved versions. */
  history: UploadUsageHistoryRef[];
};

const HISTORY_LABEL: Record<HistoryEntity, string> = {
  Project: "Project",
  AdSpace: "Ad space",
  Person: "Cast & Crew directory",
  Portfolio: "Portfolio",
  Testimonial: "Testimonial",
  Partner: "Partner",
};

function historyHref(entity: HistoryEntity, id: number): string {
  switch (entity) {
    case "Project":
      return `/admin/projects/${id}/edit`;
    case "AdSpace":
      return `/admin/ad-spaces/${id}/edit`;
    case "Portfolio":
      return `/admin/portfolio/${id}/edit`;
    case "Testimonial":
      return `/admin/testimonials/${id}/edit`;
    case "Partner":
      return `/admin/partners/${id}/edit`;
    case "Person":
      // No per-person edit page — the whole directory is one table.
      return "/admin/cast";
  }
}

/** The live title/name for an entity+id, or null if the record is gone. */
async function liveTitle(entity: HistoryEntity, id: number): Promise<string | null> {
  if (entity === "Project") return (await prisma.project.findUnique({ where: { id }, select: { title: true } }))?.title ?? null;
  if (entity === "AdSpace") return (await prisma.adSpace.findUnique({ where: { id }, select: { title: true } }))?.title ?? null;
  if (entity === "Person") return (await prisma.person.findUnique({ where: { id }, select: { name: true } }))?.name ?? null;
  if (entity === "Portfolio") return (await prisma.portfolio.findUnique({ where: { id }, select: { title: true } }))?.title ?? null;
  if (entity === "Testimonial") return (await prisma.testimonial.findUnique({ where: { id }, select: { authorName: true } }))?.authorName ?? null;
  return (await prisma.partner.findUnique({ where: { id }, select: { name: true } }))?.name ?? null;
}

/** Best-effort title/name for a record that's gone, read out of its last
 *  saved snapshot (so the warning can say *what* was deleted, not just an id). */
function titleFromSnapshot(entity: HistoryEntity, snapshotJson: string): string {
  try {
    const data = JSON.parse(snapshotJson) as Record<string, unknown>;
    const value =
      entity === "Person" || entity === "Partner" ? data.name : entity === "Testimonial" ? data.authorName : data.title;
    return typeof value === "string" && value ? value : "deleted record";
  } catch {
    return "deleted record";
  }
}

export async function findUploadUsage(publicPath: string): Promise<UploadUsage> {
  const current: UploadUsageRef[] = [];
  // Every (entity, live id) already reported in `current`, so the history
  // pass below doesn't repeat it as a second, redundant line.
  const liveKeys = new Set<string>();

  const projects = await prisma.project.findMany({
    // gallery/references are JSON strings stored as TEXT — `contains` = LIKE
    // %path%; the path (timestamp + uuid) is unique enough that a substring
    // hit is real. videoFile is the project's own trailer, matched exactly.
    where: {
      OR: [
        { poster: publicPath },
        { gallery: { contains: publicPath } },
        { videoFile: publicPath },
        { references: { contains: publicPath } },
      ],
    },
    select: { id: true, title: true },
    take: 25,
  });
  for (const p of projects) {
    current.push({ label: `Project: ${p.title}`, href: `/admin/projects/${p.id}/edit` });
    liveKeys.add(`Project:${p.id}`);
  }

  // Per-project cast/crew credit — the photo lives on the Actor row, but the
  // record a person edits (and the one ContentVersion snapshots) is the
  // project itself.
  const actors = await prisma.actor.findMany({
    where: { photo: publicPath },
    select: { name: true, projectId: true },
    take: 25,
  });
  for (const a of actors) {
    current.push({ label: `Cast/crew: ${a.name}`, href: `/admin/projects/${a.projectId}/edit` });
    liveKeys.add(`Project:${a.projectId}`);
  }

  // Sponsorship tier / placement stills — also part of the Project aggregate
  // (buildSnapshot pulls both in), so they key off the same Project history.
  const tiers = await prisma.sponsorshipTier.findMany({
    where: { image: publicPath },
    select: { name: true, projectId: true, project: { select: { title: true } } },
    take: 25,
  });
  for (const t of tiers) {
    current.push({ label: `Sponsorship tier: ${t.name} (${t.project.title})`, href: `/admin/projects/${t.projectId}/edit` });
    liveKeys.add(`Project:${t.projectId}`);
  }

  const placements = await prisma.placement.findMany({
    where: { image: publicPath },
    select: { title: true, projectId: true, project: { select: { title: true } } },
    take: 25,
  });
  for (const pl of placements) {
    current.push({ label: `Placement: ${pl.title} (${pl.project.title})`, href: `/admin/projects/${pl.projectId}/edit` });
    liveKeys.add(`Project:${pl.projectId}`);
  }

  // The reusable global directory (#9) — separate from the per-project Actor
  // row above; a person's directory photo isn't necessarily the photo snapshotted
  // onto any project credit.
  const persons = await prisma.person.findMany({ where: { photo: publicPath }, select: { id: true, name: true }, take: 25 });
  for (const p of persons) {
    current.push({ label: `Cast & Crew directory: ${p.name}`, href: "/admin/cast" });
    liveKeys.add(`Person:${p.id}`);
  }

  const portfolios = await prisma.portfolio.findMany({ where: { image: publicPath }, select: { id: true, title: true }, take: 25 });
  for (const p of portfolios) {
    current.push({ label: `Portfolio: ${p.title}`, href: `/admin/portfolio/${p.id}/edit` });
    liveKeys.add(`Portfolio:${p.id}`);
  }

  // Ad spaces carry a main photo plus a JSON gallery, same shape as a project's
  // — without this a file two spaces share would be deleted with the first of
  // them, and the media library would offer to remove a live listing's photo.
  const adSpaces = await prisma.adSpace.findMany({
    where: { OR: [{ image: publicPath }, { gallery: { contains: publicPath } }] },
    select: { id: true, title: true },
    take: 25,
  });
  for (const s of adSpaces) {
    current.push({ label: `Ad space: ${s.title}`, href: `/admin/ad-spaces/${s.id}/edit` });
    liveKeys.add(`AdSpace:${s.id}`);
  }

  // A testimonial can point the same file from three fields (poster, clip,
  // avatar) — checked as one OR, same shape as the ad space image/gallery pair.
  const testimonials = await prisma.testimonial.findMany({
    where: { OR: [{ image: publicPath }, { video: publicPath }, { avatar: publicPath }] },
    select: { id: true, authorName: true },
    take: 25,
  });
  for (const te of testimonials) {
    current.push({ label: `Testimonial: ${te.authorName}`, href: `/admin/testimonials/${te.id}/edit` });
    liveKeys.add(`Testimonial:${te.id}`);
  }

  const partners = await prisma.partner.findMany({ where: { logo: publicPath }, select: { id: true, name: true }, take: 25 });
  for (const p of partners) {
    current.push({ label: `Partner: ${p.name}`, href: `/admin/partners/${p.id}/edit` });
    liveKeys.add(`Partner:${p.id}`);
  }

  const avatarCount = await prisma.user.count({ where: { avatar: publicPath } });
  if (avatarCount > 0) {
    // Not versioned (User isn't a history entity) and there's no per-user
    // admin page to link to — label only.
    current.push({ label: `User avatar${avatarCount > 1 ? ` (×${avatarCount})` : ""}`, href: null });
  }

  // History: saved versions that still mention this path for a record whose
  // *current* state doesn't (either it was edited to drop the file, or the
  // record is gone entirely). Grouped so one record with many old versions
  // reads as one line, not a wall of duplicates.
  const hits = await prisma.contentVersion.groupBy({
    by: ["entity", "entityId"],
    where: { mediaPaths: { contains: publicPath } },
    _count: true,
    _max: { createdAt: true },
  });

  const history: UploadUsageHistoryRef[] = [];
  for (const hit of hits) {
    const entity = hit.entity as HistoryEntity;
    const key = `${entity}:${hit.entityId}`;
    if (liveKeys.has(key)) continue; // already shown as a current reference

    const title = await liveTitle(entity, hit.entityId);
    const href = title !== null ? historyHref(entity, hit.entityId) : null;
    const label =
      title !== null
        ? `${HISTORY_LABEL[entity]}: ${title}`
        : `${HISTORY_LABEL[entity]}: ${await deletedTitle(entity, hit.entityId)}`;

    history.push({
      label,
      href,
      versions: hit._count,
      lastVersionAt: hit._max.createdAt!.getTime(),
    });
  }

  return { current, history };
}

/** Title/name of a record that no longer exists, read from its last saved
 *  version (the DELETE snapshot, or whatever was last written for it). */
async function deletedTitle(entity: HistoryEntity, entityId: number): Promise<string> {
  const last = await prisma.contentVersion.findFirst({
    where: { entity, entityId },
    orderBy: { version: "desc" },
    select: { snapshot: true },
  });
  return last ? titleFromSnapshot(entity, last.snapshot) : "deleted record";
}
