import Link from "next/link";
import { HelpCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { requireMember } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/data/locale";
import { isArchived } from "@/lib/data/format";
import { labelSep, makeUI } from "@/lib/i18n";
import { missingCount, projectCompleteness } from "@/lib/project-completeness";
import { mediaUrl } from "@/lib/media-url";
import type { ModerationStatus } from "@prisma/client";

/* CREATOR cabinet home — and the project list, which used to be a separate
   page at /account/projects.

   This page carried three cards ("Submit a project", "My projects",
   "Notifications") that repeated the sidebar entries word for word, so the
   first thing after signing in was a menu of the menu: every real task was one
   click further away than it needed to be. The list is the work, so the list is
   the page (owner decision 2026-08-07). /account/projects redirects here. */

const STATUS_PILL: Record<ModerationStatus, string> = {
  DRAFT: "border-border bg-muted text-muted-foreground",
  PENDING: "border-warn/25 bg-warn/10 text-warn",
  APPROVED: "border-success/30 bg-success/10 text-success",
  REJECTED: "border-danger/30 bg-danger/10 text-danger",
};

/** Which statuses get a counter above the grid, in the order a project moves
 *  through them. DRAFT is left out: nothing in the codebase sets it. */
const SUMMARY_ORDER: ModerationStatus[] = ["PENDING", "APPROVED", "REJECTED"];

export default async function AccountPage() {
  const user = await requireMember();
  // F13: whoever can't sell gets bounced to their brand cabinet — handled by
  // the (creator) route group's own layout, which runs before this page (see
  // account/(creator)/layout.tsx). `role` alone can't answer that anymore for
  // a dual member, so this page no longer re-checks it itself.

  const [locale, projects] = await Promise.all([
    getLocale(),
    prisma.project.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: "desc" },
      // Audit 4.8: the creator had no numbers about their own listing at all.
      // Only counts are exposed — WHICH brands shortlisted a project stays
      // private to those brands (that is what Favorite is for).
      include: {
        _count: {
          select: {
            favorites: true,
            // Feed the "profile incomplete" badge (audit B8) — an empty block
            // is invisible on the public page, so this list was the last place
            // a creator could notice one before a brand didn't.
            actors: true,
            milestones: true,
            placements: true,
          },
        },
        // Not a count: a package with no benefits list isn't publishable, so
        // it must not read as a filled section either.
        tiers: { select: { benefits: true } },
      },
    }),
  ]);
  const t = makeUI(locale);

  /** Empty report-page blocks for one listing — see projectCompleteness. */
  function incompleteCount(p: (typeof projects)[number]): number {
    return missingCount(
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
    );
  }

  const STATUS_LABEL: Record<ModerationStatus, string> = {
    DRAFT: t("account.status.draft"),
    PENDING: t("account.status.pending"),
    APPROVED: t("account.status.approved"),
    REJECTED: t("account.status.rejected"),
  };

  // Counted here rather than with a groupBy: the rows are already loaded, and
  // a second round-trip to count what's in memory would be silly.
  const summary = SUMMARY_ORDER.map((status) => ({
    status,
    count: projects.filter((p) => p.moderationStatus === status).length,
  })).filter((s) => s.count > 0);

  return (
    <>
      <Reveal>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">
              {t("account.myProjects")}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {t("account.welcome", { name: user.name })}
            </p>
          </div>
          {/* The one primary action on this screen. Only shown alongside an
              existing list — the empty state below carries its own, bigger. */}
          {projects.length > 0 && (
            <Button asChild variant="primary" size="md">
              <Link href="/account/projects/new">
                <Plus className="h-4 w-4" />
                {t("account.submitProject")}
              </Link>
            </Button>
          )}
        </div>

        {/* Where the portfolio stands, in one line: how many are waiting on a
            moderator, how many are live, how many came back. */}
        {summary.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {summary.map((s) => (
              <span
                key={s.status}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${STATUS_PILL[s.status]}`}
              >
                {STATUS_LABEL[s.status]}
                <span className="font-semibold">{s.count}</span>
              </span>
            ))}
          </div>
        )}
      </Reveal>

      {projects.length === 0 ? (
        <Reveal delay={0.05}>
          <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <p className="text-muted-foreground">{t("account.noProjects")}</p>
            <Button asChild variant="primary" size="md">
              <Link href="/account/projects/new">{t("account.submitFirstProject")}</Link>
            </Button>
            {/* Quiet second door: the form asks for ~30 fields and several
                assets, and there was nowhere to find that out beforehand. */}
            <Link
              href="/for-creators"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
              {t("forCreators.entryLink")}
            </Link>
          </div>
        </Reveal>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => {
            // The creator can open their own project whatever its status
            // (owner decision 2026-07-26): the page 404s for everyone else
            // until it is approved, but its author needs to see what they
            // submitted — especially after a rejection, to know what to fix.
            const preview = (
              <div className="overflow-hidden rounded-t-2xl">
                <div className="aspect-video w-full bg-muted">
                  {p.poster && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaUrl(p.poster)} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
              </div>
            );
            return (
              <Reveal key={p.id} delay={0.05 * (i % 6)}>
                <div className="h-full overflow-hidden rounded-2xl border border-border bg-card">
                  <Link
                    href={`/reports/${p.id}`}
                    className="block transition-transform hover:-translate-y-0.5"
                  >
                    {preview}
                  </Link>
                  <div className="p-4">
                    <span
                      className={`inline-block rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_PILL[p.moderationStatus]}`}
                    >
                      {STATUS_LABEL[p.moderationStatus]}
                    </span>
                    {/* Past its placement deadline the listing leaves the
                        catalog and stops taking offers. Told plainly here,
                        because from the creator's side nothing else would
                        explain why the views stopped — moving the deadline in
                        the form brings it back. */}
                    {isArchived(p.applicationDeadline?.toISOString() ?? null, p.applicationDeadlineOngoing) ? (
                      <span className="ml-2 inline-block rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                        {t("account.status.archived")}
                      </span>
                    ) : null}
                    {/* How many report-page blocks are still empty. They don't
                        render at all for a brand, so nothing else on this card
                        would show that the listing is half-built. */}
                    {incompleteCount(p) > 0 ? (
                      <span
                        title={t("completeness.badgeTitle", { n: incompleteCount(p) })}
                        className="ml-2 inline-block rounded-full border border-warn/30 bg-warn/10 px-2.5 py-1 text-xs font-medium text-warn"
                      >
                        {t("completeness.badge", { n: incompleteCount(p) })}
                      </span>
                    ) : null}
                    {/* Show the name in the reader's own language, falling back
                        the way the catalog does. The legacy `title` column is
                        only rebuilt when a project is saved, so relying on it
                        hid renames made in one locale. */}
                    <h3 className="mt-2 truncate font-semibold text-foreground">
                      {(locale === "hy" ? p.titleHy : locale === "ru" ? p.titleRu : p.titleEn) ||
                        p.titleEn ||
                        p.title}
                    </h3>
                    {/* The #PP-… code is a staff-side identifier and is not
                        shown in member cabinets (owner decision 2026-07-26). */}
                    {/* Views / shortlists — shown once the listing is public,
                        since a pending project can't have collected any yet. */}
                    {p.moderationStatus === "APPROVED" ? (
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>
                          {t("account.stats.views")}
                          {labelSep(locale)}{" "}
                          <span className="font-semibold text-foreground">{p.viewCount}</span>
                        </span>
                        <span>
                          {t("account.stats.favorites")}
                          {labelSep(locale)}{" "}
                          <span className="font-semibold text-foreground">{p._count.favorites}</span>
                        </span>
                        {/* No application count: brand applications are handled
                            by staff, and a number the creator can't act on or
                            open only invites "where do I see them?" (owner
                            decision 2026-08-07). */}
                      </div>
                    ) : null}
                    {/* Why the moderator turned it down. The reason was typed but
                        discarded before (audit 1.4), so a rejected card gave the
                        creator nothing to act on. */}
                    {p.moderationStatus === "REJECTED" && p.rejectionReason ? (
                      <p className="mt-3 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-xs leading-relaxed text-foreground">
                        <span className="font-semibold text-danger">{t("account.rejectionReason")}</span>{" "}
                        {p.rejectionReason}
                      </p>
                    ) : null}
                    {/* Closes the "edit and resubmit" loop the rejection email
                        promises (audit 2.4 / owner decision C.6). A published
                        project is no longer editable here — it is live in the
                        catalog and its changes go through staff (2026-08-07) —
                        so the link becomes "view what was submitted", which is
                        also the only place the creator can see the fields that
                        never reach the public page. */}
                    {p.moderationStatus === "APPROVED" ? (
                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <Link
                          href={`/account/projects/${p.id}/edit`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {t("account.viewProject")}
                        </Link>
                        <span className="text-xs text-muted-foreground">
                          {t("account.editsViaEditors")}
                        </span>
                      </div>
                    ) : (
                      <Link
                        href={`/account/projects/${p.id}/edit`}
                        className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
                      >
                        {t("account.editProject")}
                      </Link>
                    )}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      )}
    </>
  );
}
