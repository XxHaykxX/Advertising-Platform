import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireModerator } from "@/lib/auth/require";
import { canEditContent } from "@/lib/auth/permissions";
import type { ModerationStatus } from "@prisma/client";
import { findAdChannelByCode } from "@/lib/ad-channels";
import { makeUI } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media-url";
import { AdSpaceRowActions, RowActions } from "./row-actions";

/* #13: project-level moderation queue. Accounts self-approve (see
   lib/auth/members.ts); what actually gates the public catalog is each
   Project's moderationStatus. Creator-submitted projects (task #16) land
   here as PENDING. */

const STATUS_LABEL: Record<ModerationStatus, string> = {
  DRAFT: "Draft",
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const STATUS_PILL: Record<ModerationStatus, string> = {
  DRAFT: "border-border bg-muted text-muted-foreground",
  PENDING: "border-warn/25 bg-warn/10 text-warn",
  APPROVED: "border-success/30 bg-success/10 text-success",
  REJECTED: "border-danger/30 bg-danger/10 text-danger",
};

const TABS: { key: "PENDING" | "REJECTED" | "ALL"; label: string }[] = [
  { key: "PENDING", label: "Pending" },
  { key: "REJECTED", label: "Rejected" },
  { key: "ALL", label: "All" },
];

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(d);
}

export default async function ModerationAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  // 404s a non-moderator (Publisher, or a member somehow reaching /admin)
  // instead of revealing the page exists — same disguise pattern as the
  // other requireX gates in lib/auth/require.ts.
  const staff = await requireModerator();
  // Audit 3.2: a plain MODERATOR can't open /admin/projects/[id]/edit (404 —
  // that's content-editor-only), so the title link used to dead-end there.
  // Content editors (SUPERADMIN/PUBLISHER) keep the edit link; a MODERATOR
  // gets the public report page instead, which they can actually open (see
  // the activeOnly bypass in app/reports/[id]/page.tsx).
  const canEdit = canEditContent(staff.role);
  // The panel is English-only; the channel names live in the dictionary.
  const tEn = makeUI("en");

  const { tab: rawTab } = await searchParams;
  const tab: "PENDING" | "REJECTED" | "ALL" =
    rawTab === "REJECTED" || rawTab === "ALL" ? rawTab : "PENDING";

  // Ad spaces (stage 3) share this queue: same statuses, same two answers, so
  // the tab counts are the sum — a badge that only counted projects would let
  // a submitted billboard sit behind a zero.
  const [projects, adSpaces, pendingCount, rejectedCount] = await Promise.all([
    prisma.project.findMany({
      where: tab === "ALL" ? undefined : { moderationStatus: tab },
      orderBy: { createdAt: "desc" },
      include: { owner: { select: { name: true, email: true } } },
    }),
    prisma.adSpace.findMany({
      where: tab === "ALL" ? undefined : { moderationStatus: tab },
      orderBy: { createdAt: "desc" },
      include: {
        owner: { select: { name: true, email: true } },
        _count: { select: { offers: true } },
      },
    }),
    prisma.project.count({ where: { moderationStatus: "PENDING" } }).then(async (n) =>
      n + (await prisma.adSpace.count({ where: { moderationStatus: "PENDING" } })),
    ),
    prisma.project.count({ where: { moderationStatus: "REJECTED" } }).then(async (n) =>
      n + (await prisma.adSpace.count({ where: { moderationStatus: "REJECTED" } })),
    ),
  ]);

  const COUNTS: Record<"PENDING" | "REJECTED" | "ALL", number> = {
    PENDING: pendingCount,
    REJECTED: rejectedCount,
    ALL: 0, // "All" isn't a meaningful running total here — omit the count.
  };

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Moderation</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review projects and ad spaces submitted for the public catalog.
        </p>
      </div>

      {/* filter tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = t.key === tab;
          return (
            <Link
              key={t.key}
              href={t.key === "PENDING" ? "/admin/moderation" : `/admin/moderation?tab=${t.key}`}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {t.label}
              {t.key !== "ALL" && ` · ${COUNTS[t.key]}`}
            </Link>
          );
        })}
      </div>

      {projects.length === 0 && adSpaces.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border bg-card py-16 text-center text-muted-foreground">
          Nothing here.
        </div>
      ) : null}

      {projects.length > 0 ? (
        <>
          <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Projects
          </h2>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Poster</th>
                <th className="px-4 py-3 font-medium">Title / Code</th>
                <th className="px-4 py-3 font-medium">Genre</th>
                <th className="px-4 py-3 font-medium">Creator</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="border-b border-border align-top last:border-b-0 hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div className="h-10 w-16 overflow-hidden rounded bg-muted">
                      {p.poster && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={mediaUrl(p.poster)} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {/* The title opens the project as it will be seen, not the
                        edit form: this queue is for judging a submission, and
                        landing straight in a form invites rewriting someone
                        else's project instead of approving or rejecting it.
                        Editing is a separate, deliberate click below. */}
                    <Link
                      href={`/reports/${p.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {/* Per-locale columns first, same order as
                          /admin/projects: the legacy `title` is only rebuilt on
                          save, so an Armenian-only rename would not show here. */}
                      {p.titleHy || p.titleRu || p.titleEn || p.title}
                    </Link>
                    {canEdit ? (
                      <Link
                        href={`/admin/projects/${p.id}/edit`}
                        className="mt-0.5 block text-xs text-muted-foreground hover:text-primary"
                      >
                        Edit
                      </Link>
                    ) : null}
                    {/* The #PP-… code is internal bookkeeping and is not shown
                        anywhere in the UI (owner decision, repeated). */}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.genre}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div>{p.owner.name}</div>
                    <div className="text-xs">{p.owner.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_PILL[p.moderationStatus]}`}
                    >
                      {STATUS_LABEL[p.moderationStatus]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(p.createdAt)}</td>
                  <td className="px-4 py-3">
                    {(p.moderationStatus === "PENDING" || p.moderationStatus === "REJECTED") && (
                      <RowActions projectId={p.id} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      ) : null}

      {adSpaces.length > 0 ? (
        <>
          <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Ad spaces
          </h2>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Photo</th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Channel</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Offers</th>
                  <th className="px-4 py-3 font-medium">Owner</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Submitted</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {adSpaces.map((s) => {
                  // The public card, the same page a visitor lands on — a
                  // MODERATOR cannot open /admin/ad-spaces/…/edit (that section
                  // is content-editor-only), so linking there would dead-end
                  // the very row it belongs to.
                  const slug = findAdChannelByCode(s.channel)?.slug ?? "";
                  return (
                    <tr key={s.id} className="border-b border-border align-top last:border-b-0 hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="h-10 w-16 overflow-hidden rounded bg-muted">
                          {s.image && (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={mediaUrl(s.image)} alt="" className="h-full w-full object-cover" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {s.titleHy || s.titleRu || s.titleEn || s.title}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{tEn(`adChannel.${s.channel}`)}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {[s.city, s.address].filter(Boolean).join(", ")}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{s._count.offers}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <div>{s.owner.name}</div>
                        <div className="text-xs">{s.owner.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_PILL[s.moderationStatus]}`}
                        >
                          {STATUS_LABEL[s.moderationStatus]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(s.createdAt)}</td>
                      <td className="px-4 py-3">
                        {(s.moderationStatus === "PENDING" || s.moderationStatus === "REJECTED") && (
                          <AdSpaceRowActions adSpaceId={s.id} viewHref={`/ads/${slug}/${s.code}`} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}
