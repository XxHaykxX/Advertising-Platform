import Link from "next/link";
import { Download } from "lucide-react";
import {
  listApplications,
  statusCounts,
  isAppStatus,
} from "@/lib/data/applications";
import { formatDateTime } from "@/lib/data/format";
import { APP_STATUSES, STATUS_LABEL, type AppStatus } from "@/lib/constants";
import { requireSuperadmin } from "@/lib/auth/require";
import { StatusSelect } from "./status-select";

const TABS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  ...APP_STATUSES.map((s) => ({ key: s, label: STATUS_LABEL[s] })),
];

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  // Brand-lead applications are super-admin only (Publishers never see leads
  // for their films) — 404s a Publisher hitting this URL directly.
  await requireSuperadmin();

  const { status: raw } = await searchParams;
  const filter: AppStatus | undefined =
    raw && isAppStatus(raw) ? raw : undefined;

  const [apps, counts] = await Promise.all([
    listApplications(filter),
    statusCounts(),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Applications</h1>
          <p className="mt-1 text-sm text-white/55">
            Total {counts.all ?? 0} · showing {apps.length}
          </p>
        </div>
        <a
          href="/admin/applications/export"
          className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:border-white/30 hover:text-white"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </a>
      </div>

      {/* filter tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = (t.key === "all" && !filter) || t.key === filter;
          const count = t.key === "all" ? counts.all ?? 0 : counts[t.key] ?? 0;
          return (
            <Link
              key={t.key}
              href={t.key === "all" ? "/admin/applications" : `/admin/applications?status=${t.key}`}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-white/15 bg-black/30 text-white/60 hover:border-white/30 hover:text-white"
              }`}
            >
              {t.label} · {count}
            </Link>
          );
        })}
      </div>

      {/* table */}
      {apps.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] py-16 text-center text-white/50">
          No applications.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03] text-left text-xs uppercase tracking-wide text-white/45">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-white/5 transition-colors hover:bg-white/[0.03]"
                >
                  <td className="px-4 py-3 text-white/55">
                    <Link href={`/admin/applications/${a.id}`} className="block">
                      {formatDateTime(a.createdAt)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/applications/${a.id}`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {a.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-white/70">{a.phone}</td>
                  <td className="px-4 py-3 text-white/60">
                    {a.projectTitle || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusSelect id={a.id} status={a.status as AppStatus} />
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
