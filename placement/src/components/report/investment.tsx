import { BarChart3, Check, Download, Share2 } from "lucide-react";
import { AccentBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApplyDialog } from "@/components/apply-dialog";
import { Reveal } from "@/components/ui/reveal";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";
import type { ProjectDetailDTO } from "@/lib/types";

const INCLUDED_ITEM_KEYS = [
  "investment.item1",
  "investment.item2",
  "investment.item3",
  "investment.item4",
  "investment.item5",
  "investment.item6",
];

const COMPARISON_ROW_KEYS = [
  { channelKey: "investment.tvCommercial", cost: "$150,000+" },
  { channelKey: "investment.printAd", cost: "$50,000+" },
  { channelKey: "investment.influencer", cost: "$10,000-50,000" },
];

export function Investment({
  project,
  locale = DEFAULT_LOCALE,
}: {
  project: ProjectDetailDTO;
  locale?: Locale;
}) {
  const t = makeUI(locale);
  return (
    <section id="investment" className="py-10">
      <div className="mx-auto w-full max-w-[1200px] px-6 max-sm:px-4">
        <Reveal>
          <h2 className="text-2xl font-bold text-foreground">{t("investment.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("investment.subtitle")}
          </p>
        </Reveal>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Reveal delay={0.05}>
            <div className="h-full rounded-2xl border border-border bg-card p-6">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("investment.investmentLabel")}
              </span>
              <div className="mt-1 text-3xl font-extrabold text-foreground">
                {project.budgetRange}
              </div>
              <ul className="mt-5 space-y-2.5">
                {INCLUDED_ITEM_KEYS.map((key) => (
                  <li key={key} className="flex items-start gap-2.5 text-sm text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {t(key)}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="h-full rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <BarChart3 className="h-4 w-4 text-primary" />
                {t("investment.howCompares")}
              </div>

              <div className="mt-4 rounded-lg bg-success/10 px-3 py-2 text-sm font-medium text-success">
                {t("investment.cheaperThanTv")}
              </div>

              <table className="mt-4 w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 font-medium">{t("investment.channel")}</th>
                    <th className="pb-2 text-right font-medium">{t("investment.typicalCost")}</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROW_KEYS.map((row) => (
                    <tr key={row.channelKey} className="border-t border-border">
                      <td className="py-2.5 text-muted-foreground">{t(row.channelKey)}</td>
                      <td className="py-2.5 text-right text-foreground">{row.cost}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-border">
                    <td className="py-2.5">
                      <span className="flex items-center gap-2 font-semibold text-primary">
                        {t("investment.thisPlatform")}
                        <AccentBadge>{t("investment.bestValue")}</AccentBadge>
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-semibold text-primary">
                      {project.cpmRange}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.15}>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-primary/5 px-6 py-5">
            <div>
              <h3 className="font-semibold text-foreground">{t("investment.readyTitle")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("investment.readyBody")}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="secondary" size="sm">
                <Download className="mr-1.5 h-4 w-4" />
                {t("report.downloadPdf")}
              </Button>
              <Button variant="secondary" size="sm">
                <Share2 className="mr-1.5 h-4 w-4" />
                {t("report.share")}
              </Button>
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
          </div>
        </Reveal>
      </div>
    </section>
  );
}
