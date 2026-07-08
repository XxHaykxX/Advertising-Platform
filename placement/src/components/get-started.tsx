import Link from "next/link";
import { Briefcase, Clapperboard } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";

export default function GetStarted({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const t = makeUI(locale);
  return (
    <Section id="get-started">
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
                <Link href="/catalog">{t("btn.browseProjects")}</Link>
              </Button>
            </div>
          </Reveal>

          {/* For Filmmakers */}
          <Reveal delay={0.3}>
            <div className="rounded-2xl border border-border bg-card p-8 card-lift">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Clapperboard className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-4 text-2xl font-bold text-foreground">{t("getStarted.forFilmmakersTitle")}</h3>
              <p className="mb-8 text-muted-foreground">
                {t("getStarted.forFilmmakersBody")}
              </p>
              <Button asChild variant="secondary" size="md">
                <Link href="/register">{t("btn.listProject")}</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
