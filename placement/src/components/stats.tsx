import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";

const STATS = [
  { number: "~$5", label: "Average CPM", source: "PQ Media" },
  { number: "85%", label: "Higher Brand Recall", source: "Nielsen" },
  { number: "2.5M+", label: "Avg Projected Views", source: "Statista" },
  { number: "74%", label: "Brand Recall Rate", source: "IPG Media Lab" },
];

export function Stats() {
  return (
    <Section muted>
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
