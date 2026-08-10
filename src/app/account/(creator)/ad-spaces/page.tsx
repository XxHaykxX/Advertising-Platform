import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { requireMember } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/data/locale";
import { labelSep, makeUI } from "@/lib/i18n";
import type { ModerationStatus } from "@prisma/client";

/* "Мои рекламные места" — the creator's own inventory outside a film, the
   twin of the project list on /account. Same card, same status pills, same
   rejection-reason block: what a creator has to do with a refused billboard is
   what they do with a refused project. */

const STATUS_PILL: Record<ModerationStatus, string> = {
  DRAFT: "border-border bg-muted text-muted-foreground",
  PENDING: "border-warn/25 bg-warn/10 text-warn",
  APPROVED: "border-success/30 bg-success/10 text-success",
  REJECTED: "border-danger/30 bg-danger/10 text-danger",
};

export default async function MyAdSpacesPage() {
  const user = await requireMember();
  // BRAND members buy inventory, they don't own it (same guard as the project
  // list).
  if (user.role !== "CREATOR") redirect("/account");

  const [locale, spaces] = await Promise.all([
    getLocale(),
    prisma.adSpace.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { offers: true } } },
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
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">{t("adSpace.mine")}</h1>
            <p className="mt-2 text-muted-foreground">{t("adSpace.mineSubtitle")}</p>
          </div>
          {spaces.length > 0 && (
            <Button asChild variant="primary" size="md">
              <Link href="/account/ad-spaces/new">
                <Plus className="h-4 w-4" />
                {t("adSpace.submit")}
              </Link>
            </Button>
          )}
        </div>
      </Reveal>

      {spaces.length === 0 ? (
        <Reveal delay={0.05}>
          <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <p className="text-muted-foreground">{t("adSpace.none")}</p>
            <Button asChild variant="primary" size="md">
              <Link href="/account/ad-spaces/new">{t("adSpace.submitFirst")}</Link>
            </Button>
          </div>
        </Reveal>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {spaces.map((s, i) => (
            <Reveal key={s.id} delay={0.05 * (i % 6)}>
              <div className="h-full overflow-hidden rounded-2xl border border-border bg-card">
                <div className="aspect-video w-full bg-muted">
                  {s.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.image} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="p-4">
                  <span
                    className={`inline-block rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_PILL[s.moderationStatus]}`}
                  >
                    {STATUS_LABEL[s.moderationStatus]}
                  </span>
                  <h3 className="mt-2 truncate font-semibold text-foreground">
                    {(locale === "hy" ? s.titleHy : locale === "ru" ? s.titleRu : s.titleEn) ||
                      s.titleEn ||
                      s.title}
                  </h3>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {t(`adChannel.${s.channel}`)}
                    {[s.city, s.address].filter(Boolean).length
                      ? ` · ${[s.city, s.address].filter(Boolean).join(", ")}`
                      : ""}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>
                      {t("adSpace.offersCount")}
                      {labelSep(locale)} <span className="font-semibold text-foreground">{s._count.offers}</span>
                    </span>
                    {s.moderationStatus === "APPROVED" ? (
                      <span>
                        {t("account.stats.views")}
                        {labelSep(locale)} <span className="font-semibold text-foreground">{s.viewCount}</span>
                      </span>
                    ) : null}
                  </div>
                  {s.moderationStatus === "REJECTED" && s.rejectionReason ? (
                    <p className="mt-3 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-xs leading-relaxed text-foreground">
                      <span className="font-semibold text-danger">{t("account.rejectionReason")}</span>{" "}
                      {s.rejectionReason}
                    </p>
                  ) : null}
                  {/* A published space is out of the creator's hands, exactly
                      like a published project: it is live and brands are
                      reading it, so changes go through staff. */}
                  {s.moderationStatus === "APPROVED" ? (
                    <p className="mt-3 text-xs text-muted-foreground">{t("account.editsViaEditors")}</p>
                  ) : (
                    <Link
                      href={`/account/ad-spaces/${s.id}/edit`}
                      className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
                    >
                      {t("adSpace.edit")}
                    </Link>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </>
  );
}
