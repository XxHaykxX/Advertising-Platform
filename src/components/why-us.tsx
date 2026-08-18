import { BarChart3, Network, Tags, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";

/* "Why us" — the four things the platform claims over booking each channel
   yourself. Not the same thing as why.tsx, which is the founders' story on
   /about; this one is an argument aimed at a buyer who is comparing us to
   phoning a billboard operator directly.

   Four, in this order, because that is what the brief asked for: the full
   network first (the reason to be here at all), then speed, then price, then
   reporting — objections in the order a media buyer raises them. */
const ITEMS: { key: string; icon: LucideIcon }[] = [
  { key: "network", icon: Network },
  { key: "fast", icon: Zap },
  { key: "pricing", icon: Tags },
  { key: "reporting", icon: BarChart3 },
];

export function WhyUs({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const t = makeUI(locale);

  return (
    <Section id="why-us" muted>
      <Container>
        <Reveal>
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {t("whyUs.title")}
            </h2>
          </div>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {ITEMS.map((item, i) => {
            const Icon = item.icon;
            return (
              <Reveal key={item.key} delay={0.06 * i}>
                <div className="flex flex-col">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-semibold text-foreground">
                    {t(`whyUs.${item.key}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t(`whyUs.${item.key}.body`)}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
