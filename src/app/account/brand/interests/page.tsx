import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Film, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GenreBadge } from "@/components/ui/badge";
import { requireMember } from "@/lib/auth/require";
import { getLocale } from "@/lib/data/locale";
import { getBrandInterests } from "@/lib/data/brand-interests";
import { formatFullDate } from "@/lib/data/format";
import { intlLocale, localizeValue, makeUI } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { InterestStatus } from "@prisma/client";
import { RemoveInterestButton } from "./remove-interest-button";

const STATUS_PILL: Record<InterestStatus, string> = {
  SENT: "border-border bg-muted text-muted-foreground",
  MUTUAL: "border-success/30 bg-success/10 text-success",
  DECLINED: "border-danger/30 bg-danger/10 text-danger",
};

/** "My Interests" — every project this BRAND member has expressed interest
 *  in (#23). MUTUAL is reserved for a future two-sided reveal (the creator
 *  also expressing interest back) — nothing currently sets it, every row
 *  starts and stays SENT (TODO, see #23 report). */
export default async function BrandInterestsPage() {
  const user = await requireMember();
  if (user.role !== "BRAND") redirect("/account");

  const locale = await getLocale();
  const t = makeUI(locale);
  const interests = await getBrandInterests(user.id, locale);

  const STATUS_LABEL: Record<InterestStatus, string> = {
    SENT: t("account.brand.interestStatusSent"),
    MUTUAL: t("account.brand.interestStatusMutual"),
    DECLINED: t("account.brand.interestStatusDeclined"),
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground md:text-3xl">{t("account.brand.navInterests")}</h1>
      <p className="mt-2 text-muted-foreground">{t("account.brand.interestsSubtitle")}</p>

      {interests.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-muted text-muted-foreground">
            <Heart className="h-6 w-6" />
          </div>
          <p className="text-lg font-semibold text-foreground">{t("account.brand.noInterestsTitle")}</p>
          <p className="max-w-sm text-sm text-muted-foreground">{t("account.brand.noInterestsPageBody")}</p>
          <Button asChild variant="primary" size="md">
            <Link href="/account/brand/browse">{t("nav.browseProjects")}</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-10 flex flex-col gap-4">
          {interests.map((interest) => (
            <div
              key={interest.id}
              className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center"
            >
              <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-lg sm:w-40">
                {interest.project.poster ? (
                  <Image
                    src={interest.project.poster}
                    alt={interest.project.title}
                    fill
                    className="object-cover"
                    sizes="160px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                    <Film className="h-6 w-6 text-primary/40" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-foreground">{interest.project.title}</h3>
                  <GenreBadge>{localizeValue(locale, "genre", interest.project.genre)}</GenreBadge>
                  <span
                    className={cn(
                      "inline-block rounded-full border px-2.5 py-1 text-xs font-medium",
                      STATUS_PILL[interest.status],
                    )}
                  >
                    {STATUS_LABEL[interest.status]}
                  </span>
                </div>
                <code className="text-xs text-muted-foreground">{interest.project.code}</code>
                <p className="mt-2 text-xs text-muted-foreground">
                  {t("account.brand.interestedOn", {
                    date: formatFullDate(interest.createdAt, intlLocale(locale)),
                  })}
                </p>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2">
                <Button asChild variant="secondary" size="sm">
                  <Link href={`/reports/${interest.project.id}`}>{t("btn.viewReport")}</Link>
                </Button>
                <RemoveInterestButton
                  projectId={interest.project.id}
                  label={t("btn.removeInterest")}
                  errorMessage={t("account.brand.expressInterestError")}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
