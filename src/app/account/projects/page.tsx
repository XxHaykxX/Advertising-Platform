import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { requireMember } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";
import type { ModerationStatus } from "@prisma/client";

const STATUS_PILL: Record<ModerationStatus, string> = {
  DRAFT: "border-border bg-muted text-muted-foreground",
  PENDING: "border-warn/25 bg-warn/10 text-warn",
  APPROVED: "border-success/30 bg-success/10 text-success",
  REJECTED: "border-danger/30 bg-danger/10 text-danger",
};

/** "Мои проекты" — a CREATOR's own submissions + their moderation status.
 *  BRAND members have no reason to be here (submitting projects is a
 *  creator-only flow, see account/page.tsx) — bounce them back to /account. */
export default async function MyProjectsPage() {
  const user = await requireMember();
  if (user.role !== "CREATOR") redirect("/account");

  const [locale, projects] = await Promise.all([
    getLocale(),
    prisma.project.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: "desc" },
      // Audit 4.8: the creator had no numbers about their own listing at all.
      // Only counts are exposed — WHICH brands shortlisted a project stays
      // private to those brands (that is what Favorite is for).
      include: { _count: { select: { favorites: true, interests: true } } },
    }),
  ]);
  const t = makeUI(locale);

  const STATUS_LABEL: Record<ModerationStatus, string> = {
    DRAFT: t("account.status.draft"),
    PENDING: t("account.status.pending"),
    APPROVED: t("account.status.approved"),
    REJECTED: t("account.status.rejected"),
  };

  return (
    <>
      <Reveal>
        <h1 className="text-3xl font-bold text-foreground md:text-4xl">
          {t("account.myProjects")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("account.myProjectsSubtitle")}</p>
      </Reveal>

      {projects.length === 0 ? (
        <Reveal delay={0.05}>
          <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <p className="text-muted-foreground">{t("account.noProjects")}</p>
            <Button asChild variant="primary" size="md">
              <Link href="/account/projects/new">{t("account.submitFirstProject")}</Link>
            </Button>
          </div>
        </Reveal>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => {
            // The creator can open their own project whatever its status
            // (owner decision 2026-07-26): the page 404s for everyone else
            // until it is approved, but its author needs to see what they
            // submitted — especially after a rejection, to know what to fix.
            const viewable = true;
            // The clickable "open live listing" area (poster + title + code).
            // Kept out of the outer wrapper (which is a plain <div>, not an
            // <a>) so the Edit link below can sit alongside it instead of
            // nesting a second anchor inside the first (audit 2.4 / C.6 — a
            // creator can now edit any of their projects, viewable or not).
            const preview = (
              <div className="overflow-hidden rounded-t-2xl">
                <div className="aspect-video w-full bg-muted">
                  {p.poster && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.poster} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
              </div>
            );
            return (
              <Reveal key={p.id} delay={0.05 * (i % 6)}>
                <div className="h-full overflow-hidden rounded-2xl border border-border bg-card">
                  {viewable ? (
                    <Link
                      href={`/reports/${p.id}`}
                      className="block transition-transform hover:-translate-y-0.5"
                    >
                      {preview}
                    </Link>
                  ) : (
                    preview
                  )}
                  <div className="p-4">
                    <span
                      className={`inline-block rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_PILL[p.moderationStatus]}`}
                    >
                      {STATUS_LABEL[p.moderationStatus]}
                    </span>
                    <h3 className="mt-2 truncate font-semibold text-foreground">{p.title}</h3>
                    {/* The #PP-… code is a staff-side identifier and is not
                        shown in member cabinets (owner decision 2026-07-26). */}
                    {/* Views / shortlists / applications — shown once the
                        listing is public, since a pending project can't have
                        collected any of them yet. */}
                    {p.moderationStatus === "APPROVED" ? (
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>
                          {t("account.stats.views")}: <span className="font-semibold text-foreground">{p.viewCount}</span>
                        </span>
                        <span>
                          {t("account.stats.favorites")}:{" "}
                          <span className="font-semibold text-foreground">{p._count.favorites}</span>
                        </span>
                        <span>
                          {t("account.stats.applications")}:{" "}
                          <span className="font-semibold text-foreground">{p._count.interests}</span>
                        </span>
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
                        promises (audit 2.4 / owner decision C.6) — shown for
                        every status, not just REJECTED, since editing an
                        APPROVED listing is also allowed (it just goes back to
                        moderation on save). */}
                    <Link
                      href={`/account/projects/${p.id}/edit`}
                      className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
                    >
                      {t("account.editProject")}
                    </Link>
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
