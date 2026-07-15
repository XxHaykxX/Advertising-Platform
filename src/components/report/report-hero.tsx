import Link from "next/link";
import { ArrowLeft, DollarSign, Wallet, Eye } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { PrintButton, ShareButton } from "@/components/report/report-actions";
import { PosterSlider } from "@/components/report/poster-slider";
import { StoryboardMarquee } from "@/components/report/storyboard-marquee";
import { SynopsisDisclosure } from "@/components/report/synopsis-disclosure";
import { parseStringArray, splitCountries } from "@/lib/data/format";
import { DEFAULT_LOCALE, localizeValue, makeUI, type Locale } from "@/lib/i18n";
import type { ProjectDetailDTO } from "@/lib/types";

export function ReportHero({
  project,
  locale = DEFAULT_LOCALE,
}: {
  project: ProjectDetailDTO;
  locale?: Locale;
}) {
  const t = makeUI(locale);
  const countries = splitCountries(project.countries).join(", ");
  const thumbnails = parseStringArray(project.gallery).slice(0, 20);
  const statusLabel = t(`report.status.${project.status}`);
  // Main slider shows the poster plus every gallery image, poster first,
  // de-duplicated in case the same file is used in both fields.
  const sliderImages = Array.from(
    new Set([project.poster, ...parseStringArray(project.gallery)].filter(Boolean)),
  );

  const metaItems = [
    localizeValue(locale, "genre", project.genre),
    project.subgenre,
    project.format,
    project.studio,
    countries,
    `${localizeValue(locale, "gender", project.audienceGender)} ${project.audienceAge}`,
    project.releaseLabel,
  ].filter(Boolean);

  return (
    <section className="pt-8 pb-4">
      <div className="mx-auto w-full max-w-[1200px] px-6 max-sm:px-4">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Link
              href="/catalog"
              className="inline-flex items-center gap-1.5 font-medium text-foreground transition-colors hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("report.backToCatalog")}
            </Link>
            <span className="text-muted-foreground">
              {t("report.catalogLabel")} | {project.code}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ShareButton
              title={project.title}
              label={t("report.share")}
              copiedLabel={t("report.linkCopied")}
              variant="secondary"
              size="sm"
            />
            <PrintButton label={t("report.downloadPdf")} variant="secondary" size="sm" />
          </div>
        </div>

        <Reveal>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            {project.title}
          </h1>
          <code className="mt-1 block text-sm text-muted-foreground">{project.code}</code>
          {project.tagline ? (
            <p className="mt-3 max-w-3xl text-lg font-medium italic text-foreground/90 md:text-xl">
              {project.tagline}
            </p>
          ) : null}
        </Reveal>

        <Reveal delay={0.05}>
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border bg-muted">
              <PosterSlider
                images={sliderImages}
                alt={project.title}
                prevLabel={t("report.prev")}
                nextLabel={t("report.next")}
              />
              <span className="absolute bottom-3 left-3 inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
                {statusLabel}
              </span>
              {project.ageRating ? (
                <span className="absolute right-3 top-3 inline-flex items-center rounded-full bg-black/75 px-2.5 py-1 text-xs font-bold text-white shadow-sm ring-1 ring-white/20">
                  {project.ageRating}
                </span>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-card p-4">
                <Eye className="h-4 w-4 text-primary" />
                <div className="mt-2 text-lg font-bold text-foreground">{project.projViews}</div>
                <div className="text-xs text-muted-foreground">{t("report.projectedViews")}</div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <DollarSign className="h-4 w-4 text-primary" />
                <div className="mt-2 text-lg font-bold text-foreground">{project.cpmDisplay}</div>
                <div className="text-xs text-muted-foreground">{t("report.cpm")}</div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <Wallet className="h-4 w-4 text-primary" />
                <div className="mt-2 text-lg font-bold text-foreground">{project.budgetDisplay}</div>
                <div className="text-xs text-muted-foreground">{t("report.budgetRange")}</div>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mt-6 flex flex-wrap gap-x-2 gap-y-1 text-sm text-muted-foreground">
            {metaItems.map((item, idx) => (
              <span key={idx} className="inline-flex items-center gap-2">
                {item}
                {idx < metaItems.length - 1 ? <span aria-hidden>·</span> : null}
              </span>
            ))}
          </p>
          <SynopsisDisclosure
            text={project.synopsis}
            moreLabel={t("report.showMore")}
            lessLabel={t("report.showLess")}
          />
        </Reveal>

        <Reveal delay={0.15}>
          <div className="mt-6">
            <StoryboardMarquee images={thumbnails} alt={project.title} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
