import { Reveal } from "@/components/ui/reveal";
import { DealCard } from "@/components/report/deal-card";
import { BackButton, PrintButton, ShareButton } from "@/components/report/report-actions";
import { PosterSlider } from "@/components/report/poster-slider";
import { toEmbedUrl } from "@/components/report/report-video";
import { StoryboardMarquee } from "@/components/report/storyboard-marquee";
import { SynopsisDisclosure } from "@/components/report/synopsis-disclosure";
import { parseStringArray } from "@/lib/data/format";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";
import type { ProjectDetailDTO } from "@/lib/types";

/** Offer summary for the hero's deal card. Computed in page.tsx (it is the
 *  same summary the sticky bar shows) rather than here, so the two can never
 *  disagree and the deadline countdown stays outside the cached queries. */
export type HeroDeal = {
  /** Cheapest offer on the page, preformatted; null when none has a price. */
  fromPrice: string | null;
  slotsFree: number;
  slotsTotal: number;
  daysLeft: number | null;
};

export function ReportHero({
  project,
  deal,
  locale = DEFAULT_LOCALE,
}: {
  project: ProjectDetailDTO;
  deal: HeroDeal;
  locale?: Locale;
}) {
  const t = makeUI(locale);
  const thumbnails = parseStringArray(project.gallery).slice(0, 20);
  // Main slider shows the poster plus every gallery image, poster first,
  // de-duplicated in case the same file is used in both fields.
  const sliderImages = Array.from(
    new Set([project.poster, ...parseStringArray(project.gallery)].filter(Boolean)),
  );
  // Video (uploaded file or YouTube/Vimeo link) leads the slider when present —
  // shown as the FIRST slide, before the poster (user request 2026-07-25). Embed
  // wins over the uploaded file, same priority as the old standalone video block.
  const videoEmbed = project.videoEmbedUrl ? toEmbedUrl(project.videoEmbedUrl) : null;
  const videoSource =
    videoEmbed || project.videoFile ? { embed: videoEmbed, file: project.videoFile || null } : undefined;

  return (
    <section className="pt-8 pb-4">
      <div className="mx-auto w-full max-w-[1200px] px-6 max-sm:px-4">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <BackButton label={t("report.back")} />
            <span className="text-muted-foreground">{t("report.catalogLabel")}</span>
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
          {project.tagline ? (
            <p className="mt-3 max-w-3xl text-lg font-medium italic text-foreground/90 md:text-xl">
              {project.tagline}
            </p>
          ) : null}
        </Reveal>

        <Reveal delay={0.05}>
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-muted">
              <PosterSlider
                images={sliderImages}
                alt={project.title}
                prevLabel={t("report.prev")}
                nextLabel={t("report.next")}
                video={videoSource}
              />
              {/* The production-status pill ("Filming", "Post-Production", …)
                  used to sit here over the poster. Removed on every project by
                  owner decision 2026-07-30: it is production trivia a brand
                  cannot act on, and it covered the image. The status still
                  lives in the production timeline, where it has context. */}
              {project.ageRating ? (
                <span className="absolute right-3 top-3 inline-flex items-center rounded-full bg-black/75 px-2.5 py-1 text-xs font-bold text-white shadow-sm ring-1 ring-white/20">
                  {project.ageRating}
                </span>
              ) : null}
            </div>

            {/* The production budget used to sit here alone in a half-width
                box, leaving the rest of the column empty. It is now the top
                tier of the deal card, which fills the column with the offer
                itself and ends in the apply button (owner decision
                2026-07-29). On a phone the columns collapse in source order,
                so the card lands right under the video. */}
            <DealCard
              budgetDisplay={project.productionBudgetDisplay || null}
              fromPrice={deal.fromPrice}
              slotsFree={deal.slotsFree}
              slotsTotal={deal.slotsTotal}
              applicationDeadline={project.applicationDeadline}
              daysLeft={deal.daysLeft}
              // The old icon row under the image, moved into this card's spare
              // space and labelled (owner decision 2026-07-30).
              meta={{
                genre: project.genre,
                format: project.format,
                studio: project.studio,
                countries: project.countries,
              }}
              locale={locale}
            />
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          {/* The icon row (genre · format · studio · countries) that used to sit
              here is now a labelled group inside KeyFacts: an icon next to a
              bare "Kinodaran" never said what the value was, and research on
              icon usability is blunt about unlabelled icons carrying unique
              facts (owner decision 2026-07-30). The synopsis now follows the
              image directly. */}
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
