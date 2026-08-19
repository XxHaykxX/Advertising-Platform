import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Film, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GenreBadge } from "@/components/ui/badge";
import { requireMember } from "@/lib/auth/require";
import { canBuy } from "@/lib/auth/capabilities";
import { getLocale } from "@/lib/data/locale";
import { getBrandInterests } from "@/lib/data/brand-interests";
import { formatFullDate } from "@/lib/data/format";
import { intlLocale, labelSep, localizeValue, makeUI } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { mediaUrl } from "@/lib/media-url";
import type { InterestStatus } from "@prisma/client";
import { RemoveInterestButton } from "./remove-interest-button";

const STATUS_PILL: Record<InterestStatus, string> = {
  SENT: "border-border bg-muted text-muted-foreground",
  MUTUAL: "border-success/30 bg-success/10 text-success",
  DECLINED: "border-danger/30 bg-danger/10 text-danger",
};

/** "My Interests" — every project this BRAND member has applied to (#23).
 *  MUTUAL/DECLINED are set by respondToInterest, and since 2026-08-07 the one
 *  who sets them is staff, not the project's creator: the answer block below
 *  is "the platform replied", which is why it says "Ответ площадки" and the
 *  accepted pill no longer talks about a mutual interest. */
export default async function BrandInterestsPage() {
  const user = await requireMember();
  if (!canBuy(user)) redirect("/account");

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
          {/* IA-43: this is the OFFERS section and its empty state showed a
              heart — the icon the sidebar uses for Favorites, one row above.
              The two sections then looked like the same thing. Matches the
              sidebar's own icon for this entry instead. */}
          <div className="grid h-14 w-14 place-items-center rounded-full bg-muted text-muted-foreground">
            <Handshake className="h-6 w-6" />
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
              <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg sm:w-40">
                {interest.project.poster ? (
                  <Image
                    src={mediaUrl(interest.project.poster)}
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
                <p className="mt-2 text-xs text-muted-foreground">
                  {t("account.brand.interestedOn", {
                    date: formatFullDate(interest.createdAt, intlLocale(locale)),
                  })}
                  {/* An application names EITHER a placement OR a tier — never
                      both — so the label says which one this is (2026-07-29). */}
                  {interest.placementTitle
                    ? ` · ${t("interests.packagePlacement")}${labelSep(locale)} ${interest.placementTitle}`
                    : interest.tierName
                      ? ` · ${t("interests.packageSponsorship")}${labelSep(locale)} ${interest.tierName}`
                      : ""}
                </p>
                {/* What this brand itself sent (2026-07-26). Without it the
                    cabinet showed a status pill over a project title and no
                    trace of the request — so a brand with several applications
                    could not tell which terms it had offered where. */}
                {interest.productInfo ? (
                  <p className="mt-2 text-xs text-muted-foreground">{interest.productInfo}</p>
                ) : null}
                {interest.message ? (
                  <p className="mt-2 whitespace-pre-wrap rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs leading-relaxed text-foreground">
                    {interest.message}
                  </p>
                ) : null}
                {/* The seller's answer. Nothing could set MUTUAL/DECLINED
                    before wave 2, so this block never had anything to show. */}
                {interest.respondedAt ? (
                  <p
                    className={cn(
                      "mt-3 rounded-lg border px-3 py-2 text-xs leading-relaxed text-foreground",
                      interest.status === "MUTUAL"
                        ? "border-success/30 bg-success/5"
                        : "border-danger/30 bg-danger/5",
                    )}
                  >
                    <span className="font-semibold">
                      {t("interests.answerFromSeller")}
                      {labelSep(locale)}
                    </span>{" "}
                    {interest.responseNote || STATUS_LABEL[interest.status]}
                  </p>
                ) : null}
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2">
                <Button asChild variant="secondary" size="sm">
                  <Link href={`/reports/${interest.project.id}`}>{t("btn.viewReport")}</Link>
                </Button>
                <RemoveInterestButton
                  interestId={interest.id}
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
