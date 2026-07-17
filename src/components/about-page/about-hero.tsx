"use client";

import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";
import { PageHero } from "@/components/ui/page-hero";

export function AboutHero({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const t = makeUI(locale);

  return (
    <PageHero
      size="hero"
      eyebrow={t("about.heroEyebrow")}
      title={t("about.heroTitle")}
      subtitle={t("about.heroSubtitle")}
      primaryCta={{ label: t("btn.browseProjects"), href: "/catalog" }}
      secondaryCta={{ label: t("about.registerCta"), href: "/register" }}
    />
  );
}
