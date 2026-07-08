import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";

interface Step {
  number: number;
  title: string;
  caption: string;
}

const brandsSteps: Step[] = [
  {
    number: 1,
    title: "Browse Anonymously",
    caption: "Explore available films and production deals without revealing your brand.",
  },
  {
    number: 2,
    title: "Express Interest",
    caption: "Submit placement requirements and budget to filmmakers you connect with.",
  },
  {
    number: 3,
    title: "Match & Negotiate",
    caption: "Collaborate with creators to craft the perfect product placement.",
  },
];

const filmmakerSteps: Step[] = [
  {
    number: 1,
    title: "Upload Script",
    caption: "Share your screenplay with placement opportunities clearly marked.",
  },
  {
    number: 2,
    title: "Receive Offers",
    caption: "Get matched with brands interested in your production.",
  },
  {
    number: 3,
    title: "Monetize Your Story",
    caption: "Negotiate terms and unlock additional funding for your film.",
  },
];

export default function HowItWorks() {
  return (
    <Section id="how-it-works">
      <Container>
        <div className="mb-16 text-center">
          <Reveal>
            <h2 className="text-4xl font-bold md:text-5xl">How It Works</h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-4 text-lg text-muted-foreground">
              Connect creators and brands. Fair deals, authentic placements.
            </p>
          </Reveal>
        </div>

        <div className="relative mx-auto max-w-4xl">
          {/* Two-column flow */}
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            {/* For Brands */}
            <div className="space-y-8">
              <Reveal delay={0.2}>
                <h3 className="text-lg font-semibold text-foreground">For Brands</h3>
              </Reveal>
              {brandsSteps.map((step, idx) => (
                <Reveal key={step.number} delay={0.2 + (idx + 1) * 0.1}>
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {step.number}
                    </div>
                    <div className="pt-1">
                      <h4 className="font-semibold text-foreground">{step.title}</h4>
                      <p className="mt-1 text-sm text-muted-foreground">{step.caption}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* For Filmmakers */}
            <div className="space-y-8">
              <Reveal delay={0.2}>
                <h3 className="text-lg font-semibold text-foreground">For Filmmakers</h3>
              </Reveal>
              {filmmakerSteps.map((step, idx) => (
                <Reveal key={step.number} delay={0.2 + (idx + 1) * 0.1}>
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {step.number}
                    </div>
                    <div className="pt-1">
                      <h4 className="font-semibold text-foreground">{step.title}</h4>
                      <p className="mt-1 text-sm text-muted-foreground">{step.caption}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          {/* Converging card at bottom center */}
          <Reveal delay={0.6}>
            <div className="mx-auto mt-16 max-w-sm rounded-lg border border-primary/30 bg-primary/5 px-6 py-8 text-center btn-glow">
              <div className="mb-2 inline-flex items-center justify-center rounded-full bg-primary/20 px-3 py-1.5">
                <span className="text-xs font-semibold text-primary">→</span>
              </div>
              <h4 className="text-lg font-bold text-foreground">Matching & Deal</h4>
              <p className="mt-2 text-sm text-muted-foreground">
                Close collaboration and secure agreements that benefit everyone.
              </p>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
