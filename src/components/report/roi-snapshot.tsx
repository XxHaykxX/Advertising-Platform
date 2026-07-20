import Link from "next/link";
import { Info, Lock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { formatCompactNumber } from "@/lib/data/format";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";
import { ReportInterestButton } from "@/components/report/report-interest-button";
import type { SiteHeaderUser } from "@/components/header";
import type { ProjectDetailDTO } from "@/lib/types";

// Guests get the login CTA; a BRAND already viewing this report gets the
// Express Interest trigger, which opens the application popup (#23 — the
// applied/open state is shared with key-facts's button via
// ReportInterestContext, see that provider in page.tsx). Other signed-in
// roles (CREATOR/staff) have no use for either action here, so the whole
// banner is omitted.
export function ExpressInterestBanner({
  className,
  locale = DEFAULT_LOCALE,
  user = null,
}: {
  className?: string;
  locale?: Locale;
  user?: SiteHeaderUser | null;
}) {
  const t = makeUI(locale);
  if (user && user.role !== "BRAND") return null;
  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-5 py-5 text-center ${className ?? ""}`}
    >
      <Lock className="h-5 w-5 text-primary" />
      {user?.role === "BRAND" ? (
        <ReportInterestButton
          labelIdle={t("btn.expressInterest")}
          labelSent={t("account.brand.alreadyInterested")}
        />
      ) : (
        <Button asChild variant="primary" size="sm" className="w-full sm:w-auto">
          <Link href="/login">{t("cta.loginToApply")}</Link>
        </Button>
      )}
    </div>
  );
}

function MetricLabel({ children, tooltip }: { children: string; tooltip: string }) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <span>{children}</span>
      <span title={tooltip} className="inline-flex cursor-help">
        <Info className="h-3.5 w-3.5 shrink-0" />
      </span>
    </div>
  );
}

export function RoiSnapshot({
  project,
  locale = DEFAULT_LOCALE,
  user = null,
}: {
  project: ProjectDetailDTO;
  locale?: Locale;
  user?: SiteHeaderUser | null;
}) {
  const t = makeUI(locale);

  return (
    <section id="roi" className="py-10">
      <div className="mx-auto w-full max-w-[1200px] px-6 max-sm:px-4">
        <Reveal>
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 md:p-8">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <TrendingUp className="h-4 w-4" />
              {t("roi.title")}
            </div>

            {project.projViews || project.cpmDisplay ? (
              <div className="mt-6 grid grid-cols-1 gap-6 min-[420px]:grid-cols-2">
                {project.projViews ? (
                  <div>
                    <div className="text-2xl font-extrabold text-foreground">{formatCompactNumber(project.projViews, locale)}</div>
                    <MetricLabel tooltip={t("roi.projectedViewersTooltip")}>
                      {t("roi.projectedViewers")}
                    </MetricLabel>
                  </div>
                ) : null}
                {project.cpmDisplay ? (
                  <div>
                    <div className="text-2xl font-extrabold text-foreground">{project.cpmDisplay}</div>
                    <MetricLabel tooltip={t("roi.cpmTooltip")}>
                      {t("roi.cpm")}
                    </MetricLabel>
                  </div>
                ) : null}
              </div>
            ) : null}

            <p className="mt-6 text-xs text-muted-foreground">
              {t("roi.poweredBy")}
            </p>

            <ExpressInterestBanner className="mt-6" locale={locale} user={user} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
