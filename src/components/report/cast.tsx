import { Reveal } from "@/components/ui/reveal";
import { CastCarousel } from "@/components/report/cast-carousel";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";
import type { ProjectDetailDTO } from "@/lib/types";

export function Cast({
  project,
  locale = DEFAULT_LOCALE,
}: {
  project: ProjectDetailDTO;
  locale?: Locale;
}) {
  if (project.actors.length === 0) return null;
  const t = makeUI(locale);

  // Press-kits often list crew (director, producers) without on-screen cast, so
  // the section renders whichever groups are present. Crew leads, cast follows.
  const crew = project.actors.filter((a) => a.kind === "CREW");
  const cast = project.actors.filter((a) => a.kind !== "CREW");

  return (
    <section id="cast" className="py-10">
      <div className="mx-auto w-full max-w-[1200px] px-6 max-sm:px-4">
        <Reveal>
          <h2 className="text-2xl font-bold text-foreground">{t("cast.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("cast.subtitle")}
          </p>
        </Reveal>

        {crew.length > 0 ? (
          <Reveal delay={0.05}>
            <div className="mt-6">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t("cast.crewHeading")}
              </h3>
              <CastCarousel actors={crew} prevLabel={t("report.prev")} nextLabel={t("report.next")} />
            </div>
          </Reveal>
        ) : null}

        {cast.length > 0 ? (
          <Reveal delay={0.1}>
            <div className="mt-6">
              {crew.length > 0 ? (
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("cast.castHeading")}
                </h3>
              ) : null}
              <CastCarousel actors={cast} prevLabel={t("report.prev")} nextLabel={t("report.next")} />
            </div>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
