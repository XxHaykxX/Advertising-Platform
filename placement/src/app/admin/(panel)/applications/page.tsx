import Link from "next/link";
import { listApplications, statusCounts } from "@/lib/data/applications";
import { requireSuperadmin } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { setApplicationStatus } from "./actions";
import { APP_STATUSES, isAppStatus, type AppStatus } from "./statuses";

const STATUS_LABEL: Record<AppStatus, string> = {
  new: "New",
  in_progress: "In Progress",
  closed: "Closed",
};

const STATUS_PILL: Record<AppStatus, string> = {
  new: "border-primary/20 bg-primary/10 text-primary",
  in_progress: "border-warn/25 bg-warn/10 text-warn",
  closed: "border-border bg-muted text-muted-foreground",
};

const TABS: { key: "all" | AppStatus; label: string }[] = [
  { key: "all", label: "All" },
  ...APP_STATUSES.map((s) => ({ key: s, label: STATUS_LABEL[s] })),
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  // Brand-lead applications are super-admin only (Publishers never see leads
  // for other studios' films) — 404s a Publisher hitting this URL directly.
  await requireSuperadmin();

  const { status: raw } = await searchParams;
  const filter: AppStatus | undefined = raw && isAppStatus(raw) ? raw : undefined;

  const [apps, counts] = await Promise.all([
    listApplications(filter),
    statusCounts(),
  ]);
  const total = counts.new + counts.in_progress + counts.closed;

  // ApplicationDTO doesn't carry `phone` — fetched directly here rather than
  // widening the shared DTO, since this admin view is the only phone reader.
  const phoneRows = await prisma.application.findMany({
    where: { id: { in: apps.map((a) => a.id) } },
    select: { id: true, phone: true },
  });
  const phoneById = new Map(phoneRows.map((r) => [r.id, r.phone]));

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Applications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Total {total} · showing {apps.length}
        </p>
      </div>

      {/* filter tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = (t.key === "all" && !filter) || t.key === filter;
          const count = t.key === "all" ? total : counts[t.key];
          return (
            <Link
              key={t.key}
              href={t.key === "all" ? "/admin/applications" : `/admin/applications?status=${t.key}`}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {t.label} · {count}
            </Link>
          );
        })}
      </div>

      {/* list */}
      {apps.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border bg-card py-16 text-center text-muted-foreground">
          No applications.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {apps.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground">{a.name}</span>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_PILL[a.status as AppStatus]}`}
                    >
                      {STATUS_LABEL[a.status as AppStatus]}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    {a.email && <span>{a.email}</span>}
                    {phoneById.get(a.id) && <span>{phoneById.get(a.id)}</span>}
                    {a.company && <span>{a.company}</span>}
                    {a.projectTitle && <span>Project: {a.projectTitle}</span>}
                    {a.budget && <span>Budget: {a.budget}</span>}
                  </div>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDate(a.createdAt)}
                </span>
              </div>

              {a.message && (
                <p className="mt-3 line-clamp-2 text-sm text-foreground/80">{a.message}</p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {APP_STATUSES.filter((s) => s !== a.status).map((s) => (
                  <form key={s} action={setApplicationStatus.bind(null, a.id, s)}>
                    <button
                      type="submit"
                      className="rounded-lg border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                    >
                      → {STATUS_LABEL[s]}
                    </button>
                  </form>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
