import { prisma } from "@/lib/prisma";
import { requireContentEditor } from "@/lib/auth/require";
import { isArchived } from "@/lib/data/format";
import { missingCount, projectCompleteness } from "@/lib/project-completeness";
import { ProjectsPanel, type ProjectRow } from "./reorder-list";

export default async function ProjectsAdminPage() {
  // Content-editor gate (not requireUser): MODERATOR and TRANSLATOR have no
  // business here, and requireUser() used to render them the panel shell with
  // an empty list instead of the 404 every other section gives them.
  const user = await requireContentEditor();
  const isSuperadmin = user.role === "SUPERADMIN";

  const projects = await prisma.project.findMany({
    where: {
      // Only what has already been decided on. A creator's submission waiting
      // for moderation used to sit in this list looking like an ordinary
      // inactive project — nothing distinguished "waiting for a decision"
      // from "approved but taken off the catalog", so a pending project read
      // as one somebody had simply switched off. The queue lives in
      // /admin/moderation; a project appears here once it is approved.
      moderationStatus: "APPROVED",
      // Publisher scoping: a Publisher only ever sees their own projects.
      // SUPERADMIN sees everything.
      ...(isSuperadmin ? {} : { ownerId: user.id }),
    },
    orderBy: { sortOrder: "asc" },
    include: {
      owner: { select: { name: true, company: true } },
      // Counts feed the "Incomplete: N" badge — see projectCompleteness. Rows
      // themselves aren't needed, only whether each block has any; packages
      // are the exception, since a package without a benefits list doesn't
      // count as filled (it can't be published either).
      _count: { select: { actors: true, milestones: true, placements: true } },
      tiers: { select: { benefits: true } },
    },
  });

  // Waiting for a decision — surfaced as a line pointing at the queue, so a
  // submission can't go unnoticed just because this list no longer shows it.
  const awaitingModeration = await prisma.project.count({
    where: {
      moderationStatus: { in: ["PENDING", "REJECTED"] },
      ...(isSuperadmin ? {} : { ownerId: user.id }),
    },
  });

  const rows: ProjectRow[] = projects.map((p) => ({
    id: p.id,
    poster: p.poster,
    // Read the per-locale columns directly instead of the legacy `title`.
    // `title` is only re-derived when the project is saved, so a row last
    // written before the hy-first fix (or by an older build) still carries the
    // Russian name and an Armenian-only rename never showed up here — which is
    // exactly what "the name doesn't save" turned out to be. Same order the
    // catalog uses for a default (hy) visitor.
    title: p.titleHy || p.titleRu || p.titleEn || p.title,
    isActive: p.isActive,
    // Owner wants the company on the ledger, not the individual's name — but
    // not every account has one filled in, so fall back rather than show a
    // blank cell. The owner filter in reorder-list.tsx matches on this same
    // field, so filtering and display never disagree about who "the owner" is.
    ownerName: p.owner.company || p.owner.name,
    // Derived here rather than queried: the archive is "the placement deadline
    // is behind us", with no column and no cron job to keep in sync.
    archived: isArchived(p.applicationDeadline?.toISOString() ?? null, p.applicationDeadlineOngoing),
    incomplete: missingCount(
      projectCompleteness({
        tagline: p.tagline ?? "",
        poster: p.poster,
        videoEmbedUrl: p.videoEmbedUrl,
        videoFile: p.videoFile,
        gallery: p.gallery,
        castCount: p._count.actors,
        milestonesCount: p._count.milestones,
        placementsCount: p._count.placements,
        tiers: p.tiers,
        studio: p.studio,
        kind: p.kind,
        episodes: p.episodes,
        episodeMinutes: p.episodeMinutes,
        durationMinutes: p.durationMinutes,
        references: p.references,
        applicationDeadline: p.applicationDeadline,
        applicationDeadlineOngoing: p.applicationDeadlineOngoing,
        releaseDate: p.releaseDate,
        platforms: p.platforms,
        cinemas: p.cinemas,
        productionBudgetAmd: p.productionBudgetAmd,
        ageRating: p.ageRating,
        formatCategory: p.formatCategory,
  }),
    ),
  }));

  // The header counters, the FilterBar and the table below it all share one
  // Filters state now (a number in the header jumps straight to that filter),
  // so they have to live in one client component — see ProjectsPanel.
  return <ProjectsPanel rows={rows} isSuperadmin={isSuperadmin} awaitingModeration={awaitingModeration} />;
}
