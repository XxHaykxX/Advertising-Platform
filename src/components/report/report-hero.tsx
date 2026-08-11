import { Reveal } from "@/components/ui/reveal";
import { DealCard } from "@/components/report/deal-card";
import { BackButton, PrintButton, ShareButton } from "@/components/report/report-actions";
import { PosterSlider } from "@/components/report/poster-slider";
import { toEmbedUrl } from "@/components/report/report-video";
import { SynopsisDisclosure } from "@/components/report/synopsis-disclosure";
import { formatReleaseDate, parseStringArray } from "@/lib/data/format";
import { DEFAULT_LOCALE, intlLocale, makeUI, type Locale } from "@/lib/i18n";
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
  // Formatted here rather than inside the deal card: the card is not given the
  // project's release PRECISION, and printing a day the editor never entered is
  // exactly the bug IA-42 fixed. `false` keeps the page at full DAY precision,
  // unlike the compact catalog card.
  const release = formatReleaseDate(
    project.releaseDate,
    project.releasePrecision,
    intlLocale(locale),
    false,
  );

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
            {/* Desktop only (audit B6): window.print() on a phone opens a
                system dialog for a page nobody prints from a phone, and the
                button was taking a third of the first row a brand sees. Share
                stays — that one is what a phone is actually for. */}
            <PrintButton
              label={t("report.downloadPdf")}
              variant="secondary"
              size="sm"
              className="max-sm:hidden"
            />
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
          {/* minmax(0,…) on BOTH tracks, not a bare `1.3fr_1fr`. An `fr` track's
              minimum is `auto`, i.e. the min-content width of its item — and the
              thumbnail strip's content is ~1030px wide (11 thumbs). Even though
              the strip scrolls, that width leaked into the track minimum and the
              browser resolved the row as 1032px + 232px instead of 651 + 501,
              squeezing the deal card to a third of its width. min-w-0 on the
              column itself is the same fix applied one level down, so neither
              the track nor the flex column can be pushed open by content that
              is supposed to scroll.

              items-start, not the default stretch: the left column is now taller
              than the frame alone (strip + synopsis), and stretching would leave
              the deal card floating against a column it no longer matches. */}
          <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <div className="flex min-w-0 flex-col gap-5">
              {/* The frame, the age pill and the thumbnail strip all live
                  inside PosterSlider now — the strip has to drive the same
                  scroller, so they cannot be split across a server/client
                  boundary. The production-status pill ("Filming", …) that used
                  to sit over the poster was removed on 2026-07-30: production
                  trivia a brand cannot act on, covering the image. */}
              <PosterSlider
                images={sliderImages}
                alt={project.title}
                prevLabel={t("report.prev")}
                nextLabel={t("report.next")}
                video={videoSource}
                ageRating={project.ageRating}
              />
              {/* The synopsis moved up here on 2026-08-05 (owner request). It
                  used to run the full page width under the grid, which left the
                  column beside the deal card empty for its whole height — the
                  card is roughly twice as tall as the video frame. Full width
                  also gave it a ~1100px measure; in this column it reads at a
                  sane line length. On a phone the grid collapses in source
                  order, so it still follows the images. */}
              <SynopsisDisclosure
                text={project.synopsis}
                moreLabel={t("report.showMore")}
                lessLabel={t("report.showLess")}
              />
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
              ongoing={project.applicationDeadlineOngoing}
              daysLeft={deal.daysLeft}
              // The old icon row under the image, moved into this card's spare
              // space and labelled (owner decision 2026-07-30).
              // IA-40: a project can carry more than one genre — fall back to
              // the legacy single `genre` column only when `genres` is empty,
              // same convention as the catalog card.
              meta={{
                genres: project.genres.length > 0 ? project.genres : [project.genre],
                format: project.format,
                studio: project.studio,
                countries: project.countries,
                release,
              }}
              // "Where it airs" (owner request 2026-08-05): platforms and
              // cinemas were the opening group of the facts block below. A
              // brand read the price in this card and then had to scroll to a
              // second card to learn where the thing actually shows.
              where={{
                platforms: parseStringArray(project.platforms),
                cinemas: project.cinemas,
              }}
              presentationPdf={project.presentationPdf}
              locale={locale}
            />
          </div>
        </Reveal>

        {/* The auto-scrolling storyboard marquee that used to close the hero was
            removed on 2026-08-05: it drew the same gallery images the slider
            already shows, and once those images got a real clickable thumbnail
            strip inside the slider, the marquee was the third copy of one image
            set on one screen — motion with nothing to do. */}
      </div>
    </section>
  );
}
