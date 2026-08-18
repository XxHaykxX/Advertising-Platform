import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { PartnersMarquee } from "@/components/partners-page/partners-marquee";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";
import type { PartnerDTO } from "@/lib/types";

/* The channels we sell through, as their own logos — TV stations, radio, the
   billboard networks. The marquee itself is the one /about already renders;
   only the heading around it is new, so the two can't drift.

   Renders nothing at all on an empty list rather than an empty strip with a
   heading over it: staff fills Partner from /admin/partners, and a heading
   promising a network above blank space is worse than no section. */
export function HomePartners({
  partners,
  locale = DEFAULT_LOCALE,
}: {
  partners: PartnerDTO[];
  locale?: Locale;
}) {
  if (partners.length === 0) return null;
  const t = makeUI(locale);

  return (
    <Section id="partners">
      <Container>
        <Reveal>
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {t("homePartners.title")}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {t("homePartners.subtitle")}
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-12">
            <PartnersMarquee partners={partners} />
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
