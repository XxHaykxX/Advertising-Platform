import { ExternalLink } from 'lucide-react';
import { Container } from './ui/container';
import { Section } from './ui/section';
import { Reveal } from './ui/reveal';
import { DEFAULT_LOCALE, makeUI, type Locale } from '@/lib/i18n';

interface Founder {
  initials: string;
  name: string;
  role: string;
  bio: string;
}

export default function Why({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const t = makeUI(locale);

  const founders: Founder[] = [
    { initials: 'AF', name: 'Alex Founder', role: t('why.ceoRole'), bio: t('why.ceoBio') },
    { initials: 'MF', name: 'Maria Founder', role: t('why.ctoRole'), bio: t('why.ctoBio') },
  ];

  return (
    <Section id="about" muted>
      <Container>
        <div className="mb-16 text-center">
          <Reveal>
            <h2 className="text-4xl font-bold md:text-5xl">{t('why.title')}</h2>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left: Marketing copy */}
          <div className="space-y-6">
            <Reveal delay={0.1}>
              <p className="text-lg leading-relaxed text-foreground">
                {t('why.paragraph1')}
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="text-lg leading-relaxed text-foreground">
                {t('why.paragraph2')}
              </p>
            </Reveal>
            <Reveal delay={0.3}>
              <p className="text-lg leading-relaxed text-muted-foreground">
                {t('why.paragraph3')}
              </p>
            </Reveal>
          </div>

          {/* Right: Founder cards */}
          <div className="space-y-6">
            {founders.map((founder, idx) => (
              <Reveal key={founder.initials} delay={0.2 + idx * 0.1}>
                <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 card-lift transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {founder.initials}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{founder.name}</h3>
                      <p className="text-sm text-primary font-medium">{founder.role}</p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{founder.bio}</p>
                  <div className="flex gap-3 pt-2">
                    <a
                      href="#"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-all hover:text-primary hover:border-primary"
                      aria-label={`${founder.name} LinkedIn`}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
