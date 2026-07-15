import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireModerator } from "@/lib/auth/require";
import type { ModerationStatus } from "@prisma/client";
import { RowActions } from "./row-actions";

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
  await requireModerator();

  const { tab: rawTab } = await searchParams;
  const tab: "PENDING" | "REJECTED" | "ALL" =
    rawTab === "REJECTED" || rawTab === "ALL" ? rawTab : "PENDING";

  const [projects, pendingCount, rejectedCount] = await Promise.all([
    prisma.project.findMany({
      where: tab === "ALL" ? undefined : { moderationStatus: tab },
      orderBy: { createdAt: "desc" },
      include: { owner: { select: { name: true, email: true } } },
    }),
    prisma.project.count({ where: { moderationStatus: "PENDING" } }),
    prisma.project.count({ where: { moderationStatus: "REJECTED" } }),
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
          Review projects submitted for the public catalog.
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

      {projects.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border bg-card py-16 text-center text-muted-foreground">
          Nothing here.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
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
                        <img src={p.poster} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/projects/${p.id}/edit`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {p.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">{p.code}</p>
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
      )}
    </div>
  );
}
