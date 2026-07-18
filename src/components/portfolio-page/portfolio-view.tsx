"use client";

import { useState } from "react";
import Link from "next/link";
import { Header, type SiteHeaderUser } from "@/components/header";
import { Footer } from "@/components/footer";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/ui/page-hero";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";
import { DEFAULT_CURRENCY, type CurrencyCode } from "@/lib/currency";
import type { PortfolioDTO } from "@/lib/types";
import { CaseCard } from "./case-card";
import { CaseLightbox } from "./lightbox";

export function PortfolioView({
  cases,
  locale = DEFAULT_LOCALE,
  currency = DEFAULT_CURRENCY,
  user = null,
}: {
  cases: PortfolioDTO[];
  locale?: Locale;
  currency?: CurrencyCode;
  user?: SiteHeaderUser | null;
}) {
  const t = makeUI(locale);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <>
      <Header user={user} locale={locale} currency={currency} />

      <PageHero
        eyebrow={t("portfolio.eyebrow")}
        title={t("portfolio.title")}
        subtitle={t("portfolio.subtitle")}
        locale={locale}
      />

      <main className="bg-background">
        <Container className="py-16 sm:py-20">
          {cases.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-16 text-center text-muted-foreground">
              {t("portfolio.empty")}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {cases.map((c, i) => (
                <CaseCard key={c.id} data={c} index={i} onOpen={() => setActiveIndex(i)} locale={locale} />
              ))}
            </div>
          )}
        </Container>

        <div className="border-t border-border bg-section">
          <Container className="flex flex-col items-center gap-5 py-16 text-center sm:py-20">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("portfolio.ctaTitle")}
            </h2>
            <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
              {t("portfolio.ctaBody")}
            </p>
            <Button asChild variant="primary" size="lg">
              <Link href="/catalog">{t("btn.browseCurrentProjects")}</Link>
            </Button>
          </Container>
        </div>
      </main>

      <Footer locale={locale} currency={currency} />

      <CaseLightbox
        cases={cases}
        activeIndex={activeIndex}
        onClose={() => setActiveIndex(null)}
        onNavigate={setActiveIndex}
        locale={locale}
      />
    </>
  );
}
