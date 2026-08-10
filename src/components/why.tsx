import { Container } from './ui/container';
import { Section } from './ui/section';
import { Reveal } from './ui/reveal';
import { DEFAULT_LOCALE, makeUI, type Locale } from '@/lib/i18n';

export default function Why({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const t = makeUI(locale);

  return (
    <Section id="about" muted>
      <Container>
        <div className="mb-16 text-center">
          <Reveal>
            <h2 className="text-4xl font-bold md:text-5xl">{t('why.title')}</h2>
          </Reveal>
        </div>

        {/* IA-51 §1: the founder cards that used to sit here (real names
            weren't ready yet, placeholder bios read worse than nothing) are
            gone. The copy is centered as its own column instead of being
            left-aligned next to an empty right half. */}
        {/* Block is centred, the prose inside is not: these are 4-6 line
            paragraphs, and centred text that long costs the reader the left
            edge they scan back to on every line break. */}
        <div className="mx-auto max-w-2xl space-y-6">
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
      </Container>
    </Section>
  );
}
