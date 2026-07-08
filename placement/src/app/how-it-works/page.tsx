import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "How It Works — FP Placement",
  description:
    "Explore how FP Placement connects brands with filmmakers. Browse projects anonymously, express interest, and close authentic placements.",
};

interface Step {
  number: number;
  title: string;
  description: string;
}

const brandsSteps: Step[] = [
  {
    number: 1,
    title: "Browse Catalog",
    description:
      "Explore available film and TV productions with placement opportunities. Browse anonymously until you're ready to express interest.",
  },
  {
    number: 2,
    title: "View Scene-Level Report",
    description:
      "Access detailed placement reports for each project, including scene descriptions, audience metrics, and brand safety scores.",
  },
  {
    number: 3,
    title: "Express Interest & Negotiate",
    description:
      "Submit placement requirements and budget details to filmmakers. Collaborate directly to craft authentic placements that fit your brand.",
  },
  {
    number: 4,
    title: "Close the Deal",
    description:
      "Finalize placement agreements with transparent terms. Platform fee only applies when deals close — no upfront costs.",
  },
];

const filmmakerSteps: Step[] = [
  {
    number: 1,
    title: "Register as Publisher",
    description:
      "Create your filmmaker profile and verify your credentials. Unlock access to brand partnerships and funding opportunities.",
  },
  {
    number: 2,
    title: "List Project & Placement Opportunities",
    description:
      "Upload your screenplay and clearly mark placement opportunities. Share details about target audience and creative requirements.",
  },
  {
    number: 3,
    title: "Receive Brand Applications",
    description:
      "Browse incoming applications from brands interested in your project. Review their requirements and negotiate placement terms.",
  },
  {
    number: 4,
    title: "Get Funded",
    description:
      "Close deals and unlock additional production funding through brand partnerships. Maintain creative control throughout the process.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <Header />

      {/* Hero section */}
      <Section className="border-b border-border">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <h1 className="text-5xl font-bold md:text-6xl">How It Works</h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-6 text-lg text-muted-foreground">
                FP Placement connects brands with filmmakers through a transparent, fair process.
                Discover how to get started in just four simple steps.
              </p>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Two-column steps section */}
      <Section>
        <Container>
          <div className="grid gap-16 lg:grid-cols-2">
            {/* For Brands */}
            <div>
              <Reveal>
                <h2 className="text-2xl font-bold text-foreground">For Brands</h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-2 text-sm text-muted-foreground">
                  Find authentic placement opportunities in premium film and TV productions.
                </p>
              </Reveal>

              <div className="mt-8 space-y-8">
                {brandsSteps.map((step, idx) => (
                  <Reveal key={step.number} delay={0.15 + idx * 0.08}>
                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
                        {step.number}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                        <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>

            {/* For Filmmakers */}
            <div>
              <Reveal>
                <h2 className="text-2xl font-bold text-foreground">For Filmmakers</h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-2 text-sm text-muted-foreground">
                  Unlock funding opportunities by monetizing placement in your projects.
                </p>
              </Reveal>

              <div className="mt-8 space-y-8">
                {filmmakerSteps.map((step, idx) => (
                  <Reveal key={step.number} delay={0.15 + idx * 0.08}>
                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
                        {step.number}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                        <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Trust & CTA section */}
      <Section muted>
        <Container>
          <div className="mx-auto max-w-2xl">
            <Reveal>
              <div className="rounded-2xl border border-primary/20 bg-primary/5 px-8 py-12 text-center">
                <h2 className="text-2xl font-bold text-foreground">Fair Deals. Authentic Placements.</h2>
                <p className="mt-4 text-muted-foreground">
                  FP Placement is built on transparency and trust. No hidden fees for brands, creative control
                  for filmmakers, and platform fees only when deals close.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Button asChild variant="primary" size="md">
                    <Link href="/catalog">Browse Projects</Link>
                  </Button>
                  <Button asChild variant="ghost" size="md">
                    <Link href="/register">Register as Publisher</Link>
                  </Button>
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      <Footer />
    </>
  );
}
