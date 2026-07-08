import { FileText, Globe, ShieldCheck } from 'lucide-react';
import { Container } from './ui/container';
import { Section } from './ui/section';
import { Reveal } from './ui/reveal';

export function Trust() {
  const items = [
    {
      icon: FileText,
      number: '100,000+',
      title: 'scripts analyzed',
      caption: 'with comprehensive brand intelligence',
    },
    {
      icon: Globe,
      number: '100+',
      title: 'countries covered',
      caption: 'available in major markets worldwide',
    },
    {
      icon: ShieldCheck,
      number: 'Scene-level',
      title: 'brand safety',
      caption: 'powered by AI content analysis',
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
