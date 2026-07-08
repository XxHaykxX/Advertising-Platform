import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";

export function PartnersCta() {
  return (
    <section className="relative overflow-hidden py-20 md:py-24" style={{ background: "var(--grad)" }}>
      <Container>
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Want to see your brand here?
            </h2>
            <p className="mt-4 text-base text-white/85 sm:text-lg">
              Join the FP Placement partner network and get direct access to vetted film and TV
              productions.
            </p>
            <div className="mt-8">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
                <Link href="/contact">Become a partner</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
