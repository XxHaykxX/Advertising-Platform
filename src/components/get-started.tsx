import Link from "next/link";
import { Briefcase, Clapperboard } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";

export default function GetStarted({
  locale = DEFAULT_LOCALE,
  className,
}: {
  locale?: Locale;
  /** Lets a page trim this section's own spacing where it butts against
   *  another one — see the homepage (IA-48 §4). */
  className?: string;
}) {
  const t = makeUI(locale);
  return (
    <Section id="get-started" className={className}>
      <Container>
        <div className="mb-16 text-center">
          <Reveal>
            <h2 className="text-4xl font-bold md:text-5xl">{t("getStarted.title")}</h2>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* For Brands */}
          <Reveal delay={0.2}>
            <div className="rounded-2xl border border-border bg-card p-8 card-lift">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-4 text-2xl font-bold text-foreground">{t("getStarted.forBrandsTitle")}</h3>
              <p className="mb-8 text-muted-foreground">
                {t("getStarted.forBrandsBody")}
              </p>
              <Button asChild variant="primary" size="md">
                {/* IA-48 §1: this card is the brand half of "register on the
                    platform", so it goes to the sign-up form, not the catalog.
                    ?role=brand is what the picker defaults to anyway — spelled
                    out so the link says which half it opens. */}
                <Link href="/register?role=brand">{t("btn.createAccount")}</Link>
              </Button>
            </div>
          </Reveal>

          {/* For Filmmakers */}
          <Reveal delay={0.3}>
            <div className="rounded-2xl border border-border bg-card p-8 card-lift">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Clapperboard className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-4 text-2xl font-bold text-foreground">{t("getStarted.forCreatorsTitle")}</h3>
              <p className="mb-8 text-muted-foreground">
                {t("getStarted.forCreatorsBody")}
              </p>
              <Button asChild variant="secondary" size="md">
                {/* Register has no query-param role preselection (5.9) — plain
                    /register lands on the account-type picker, defaulted to brand. */}
                <Link href="/register?role=creator">{t("btn.listProject")}</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
