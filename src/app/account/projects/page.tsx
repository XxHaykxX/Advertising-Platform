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
            // F4: only APPROVED projects are public (isActive) — let the creator
            // open their live listing. Pending/rejected/draft aren't viewable yet,
            // so those cards stay non-clickable (the status pill explains why).
            const viewable = p.moderationStatus === "APPROVED" && p.isActive;
            const inner = (
              <div className="h-full overflow-hidden rounded-2xl border border-border bg-card">
                <div className="aspect-[16/10] w-full bg-muted">
                  {p.poster && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.poster} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="p-4">
                  <span
                    className={`inline-block rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_PILL[p.moderationStatus]}`}
                  >
                    {STATUS_LABEL[p.moderationStatus]}
                  </span>
                  <h3 className="mt-2 truncate font-semibold text-foreground">{p.title}</h3>
                  <p className="text-xs text-muted-foreground">{p.code}</p>
                </div>
              </div>
            );
            return (
              <Reveal key={p.id} delay={0.05 * (i % 6)}>
                {viewable ? (
                  <Link
                    href={`/reports/${p.id}`}
                    className="block h-full rounded-2xl transition-transform hover:-translate-y-0.5"
                  >
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </Reveal>
            );
          })}
        </div>
      )}
    </>
  );
}
