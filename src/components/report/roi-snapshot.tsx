import { Info, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApplyDialog } from "@/components/apply-dialog";
import { Reveal } from "@/components/ui/reveal";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";
import type { ProjectDetailDTO } from "@/lib/types";

export function ExpressInterestBanner({
  project,
  className,
  locale = DEFAULT_LOCALE,
}: {
  project: Pick<ProjectDetailDTO, "id" | "title">;
  className?: string;
  locale?: Locale;
}) {
  const t = makeUI(locale);
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-4 rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 ${className ?? ""}`}
    >
      <ApplyDialog
        projectId={project.id}
        projectTitle={project.title}
        locale={locale}
        trigger={
          <Button variant="primary" size="sm">
            {t("btn.expressInterest")}
          </Button>
        }
      />
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
}: {
  project: ProjectDetailDTO;
  locale?: Locale;
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

            <div className="mt-6 grid grid-cols-2 gap-6">
              <div>
                <div className="text-2xl font-extrabold text-foreground">{project.projViews}</div>
                <MetricLabel tooltip={t("roi.projectedViewersTooltip")}>
                  {t("roi.projectedViewers")}
                </MetricLabel>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-foreground">{project.cpmDisplay}</div>
                <MetricLabel tooltip={t("roi.cpmTooltip")}>
                  {t("roi.cpm")}
                </MetricLabel>
              </div>
            </div>

            <p className="mt-6 text-xs text-muted-foreground">
              {t("roi.poweredBy")}
            </p>

            <ExpressInterestBanner project={project} className="mt-6" locale={locale} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
