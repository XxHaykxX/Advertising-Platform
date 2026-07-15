import { requireSuperadmin } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import type { InterestStatus } from "@prisma/client";

const STATUS_LABEL: Record<InterestStatus, string> = {
  SENT: "Sent",
  MUTUAL: "Mutual",
  DECLINED: "Declined",
};

const STATUS_PILL: Record<InterestStatus, string> = {
  SENT: "border-primary/20 bg-primary/10 text-primary",
  MUTUAL: "border-warn/25 bg-warn/10 text-warn",
  DECLINED: "border-border bg-muted text-muted-foreground",
};

function formatDate(date: Date): string {
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function InterestsPage() {
  // Brand "Express Interest" signals are super-admin only, same platform-wide
  // scoping as Applications — Publishers see only their own projects' content,
  // not who expressed interest across the whole catalog.
  await requireSuperadmin();

  const interests = await prisma.interest.findMany({
    include: { brand: true, project: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Interests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Total {interests.length}
        </p>
      </div>

      {interests.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border bg-card py-16 text-center text-muted-foreground">
          No interests yet.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {interests.map((i) => (
            <div
              key={i.id}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground">{i.brand.name}</span>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_PILL[i.status]}`}
                    >
                      {STATUS_LABEL[i.status]}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span>{i.brand.email}</span>
                    {i.brand.company && <span>{i.brand.company}</span>}
                    <span>
                      Project: {i.project.title} ({i.project.code})
                    </span>
                  </div>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDate(i.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
