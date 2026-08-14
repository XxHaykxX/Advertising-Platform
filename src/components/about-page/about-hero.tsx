"use client";

import { DEFAULT_LOCALE, useUI, type Locale } from "@/lib/i18n-client";
import { PageHero } from "@/components/ui/page-hero";

export function AboutHero({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const t = useUI(locale);

  return (
    <PageHero
      size="hero"
      eyebrow={t("about.heroEyebrow")}
      title={t("about.heroTitle")}
      subtitle={t("about.heroSubtitle")}
      primaryCta={{ label: t("btn.browseProjects"), href: "/ads" }}
      secondaryCta={{ label: t("about.registerCta"), href: "/register" }}
    />
  );
}
