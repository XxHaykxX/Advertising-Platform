import { FileText, Globe, ShieldCheck } from 'lucide-react';
import { Container } from './ui/container';
import { Section } from './ui/section';
import { Reveal } from './ui/reveal';
import { DEFAULT_LOCALE, makeUI, type Locale } from '@/lib/i18n';

export function Trust({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const t = makeUI(locale);
  const items = [
    {
      icon: FileText,
      number: t('trust.scriptsAnalyzedNumber'),
      title: t('trust.scriptsAnalyzedTitle'),
      caption: t('trust.scriptsAnalyzedCaption'),
    },
    {
      icon: Globe,
      number: t('trust.countriesNumber'),
      title: t('trust.countriesTitle'),
      caption: t('trust.countriesCaption'),
    },
    {
      icon: ShieldCheck,
      number: t('trust.safetyNumber'),
      title: t('trust.safetyTitle'),
      caption: t('trust.safetyCaption'),
    },
  ];

  return (
    <Section muted>
      <Container>
        <Reveal>
          <div className="grid grid-cols-3 gap-8 max-sm:grid-cols-1 md:gap-12">
            {items.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="flex flex-col items-center text-center">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">{item.number}</div>
                  <div className="mt-1 text-sm font-semibold text-foreground">{item.title}</div>
                  <div className="mt-2 text-xs text-muted-foreground">{item.caption}</div>
                </div>
              );
            })}
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
