import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";

export function Stats({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const t = makeUI(locale);
  const STATS = [
    { number: "~$5", label: t("stats.averageCpm"), source: "PQ Media" },
    { number: "85%", label: t("stats.higherBrandRecall"), source: "Nielsen" },
    { number: "2.5M+", label: t("stats.avgProjectedViews"), source: "Statista" },
    { number: "74%", label: t("stats.brandRecallRate"), source: "IPG Media Lab" },
  ];

  return (
    <Section muted id="stats">
      <Container>
        <div className="grid grid-cols-4 gap-8 md:grid-cols-2 max-sm:grid-cols-1">
          {STATS.map((stat, idx) => (
            <Reveal key={idx} delay={idx * 0.1} className="flex flex-col items-center text-center">
              <div className="grad-text text-4xl font-extrabold">
                {stat.number}
              </div>
              <div className="mt-2 text-base font-medium text-foreground">
                {stat.label}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {stat.source}
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
