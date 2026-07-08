import Link from "next/link";
import { Briefcase, Clapperboard } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";

export default function GetStarted() {
  return (
    <Section id="get-started">
      <Container>
        <div className="mb-16 text-center">
          <Reveal>
            <h2 className="text-4xl font-bold md:text-5xl">Get Started</h2>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* For Brands */}
          <Reveal delay={0.2}>
            <div className="rounded-2xl border border-border bg-card p-8 card-lift">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-4 text-2xl font-bold text-foreground">For Brands</h3>
              <p className="mb-8 text-muted-foreground">
                Browse vetted productions, scene-level safety scores, pay only on closed deals.
              </p>
              <Button asChild variant="primary" size="md">
                <Link href="/catalog">Browse Projects</Link>
              </Button>
            </div>
          </Reveal>

          {/* For Filmmakers */}
          <Reveal delay={0.3}>
            <div className="rounded-2xl border border-border bg-card p-8 card-lift">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Clapperboard className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-4 text-2xl font-bold text-foreground">For Filmmakers</h3>
              <p className="mb-8 text-muted-foreground">
                Monetize your production, keep creative control, free placement report.
              </p>
              <Button asChild variant="secondary" size="md">
                <Link href="/register">List Your Project</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
