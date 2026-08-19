import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Film } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/ui/page-hero";
import { DisclosureList, type DisclosureRow } from "@/components/ui/disclosure-list";
import { TierBadge } from "@/components/creator-guide/tier-badge";
import { GUIDE_STEPS, GUIDE_TIERS, FILE_REQUIREMENTS, type GuideTier } from "@/lib/creator-guide";
import { signupCtaHref } from "@/lib/auth/signup-cta";
import { getLocale } from "@/lib/data/locale";
import { getCurrency } from "@/lib/data/currency";
import { getProject } from "@/lib/data/projects";
import { prisma } from "@/lib/prisma";
import { labelSep, makeUI } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media-url";

export const metadata: Metadata = {
  title: "For Creators — iGovazd",
  description:
    "Everything a creator needs before submitting a project: the full field checklist, media requirements, requirement tiers and the moderation process.",
  alternates: { canonical: "/for-creators" },
};

/** "Վալդակար" — the showcase project, the most completely filled-in row we
 *  have, used here as the worked example.
 *
 *  Looked up by TITLE, not by id. Ids are per-environment and drift with every
 *  content reload: this project is #18 on production and #34 locally (checked
 *  2026-08-04), and it was #3 back when
 *  docs/prod-migrations/2026-07-29-fill-project-3.sql was written. A hardcoded
 *  id is therefore wrong somewhere by construction, and the failure is silent —
 *  getProject just returns null and the whole example section disappears with
 *  nobody noticing. The title is the one handle that means the same thing in
 *  every database. If it is ever renamed the section still degrades quietly
 *  rather than rendering a dead link. */
const EXAMPLE_PROJECT_TITLE = "Վալդակար";

const TIER_ORDER: GuideTier[] = ["required", "publish", "optional"];

/** Four form labels carry a baked-in " *" in the dictionary ("Жанр *",
 *  "Кол-во серий *", …) because inside the form the asterisk IS the
 *  required marker. Here every row already carries an explicit tier badge, so
 *  the asterisk is a second, weaker signal saying the same thing — and it says
 *  it in the language of a form the reader has not opened yet. Stripped for
 *  display only; the dictionary entry stays as the form needs it. */
function fieldLabel(raw: string): string {
  return raw.replace(/\s*\*\s*$/, "");
}

const MODERATION_STEPS: { titleKey: string; descKey: string }[] = [
  { titleKey: "forCreators.moderation.step1.title", descKey: "forCreators.moderation.step1.desc" },
  { titleKey: "forCreators.moderation.step2.title", descKey: "forCreators.moderation.step2.desc" },
  { titleKey: "forCreators.moderation.step3.title", descKey: "forCreators.moderation.step3.desc" },
  { titleKey: "forCreators.moderation.step4.title", descKey: "forCreators.moderation.step4.desc" },
];

const REASON_KEYS = [
  "forCreators.moderation.reasons.item1",
  "forCreators.moderation.reasons.item2",
  "forCreators.moderation.reasons.item3",
  "forCreators.moderation.reasons.item4",
];

export default async function ForCreatorsPage() {
  const locale = await getLocale();
  const currency = await getCurrency();
  const t = makeUI(locale);
  // IA-53: both "submit a project" buttons on this page pointed at /register,
  // including for a member who is already signed in and looking at the guide.
  const submitHref = await signupCtaHref("creator");
  const exampleRow = await prisma.project.findFirst({
    where: { titleHy: EXAMPLE_PROJECT_TITLE, isActive: true, moderationStatus: "APPROVED" },
    select: { id: true },
  });
  const exampleProject = exampleRow
    ? await getProject(exampleRow.id, locale, currency, true)
    : null;

  return (
    <>
      <SiteHeader />

      <PageHero
        eyebrow={t("forCreators.hero.eyebrow")}
        title={t("forCreators.hero.title")}
        subtitle={t("forCreators.hero.subtitle")}
        locale={locale}
        primaryCta={{ label: t("forCreators.hero.ctaSubmit"), href: submitHref }}
        secondaryCta={{ label: t("forCreators.hero.ctaPrepare"), href: "#steps" }}
      />

      {/* Legend — the three requirement tiers every field below is tagged with */}
      <Section>
        <Container>
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {t("forCreators.legend.title")}
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mt-3 max-w-3xl text-muted-foreground">{t("forCreators.legend.subtitle")}</p>
          </Reveal>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {TIER_ORDER.map((tier, idx) => (
              <Reveal key={tier} delay={0.15 + idx * 0.08}>
                <div className="h-full rounded-2xl border border-border bg-card p-8">
                  <TierBadge tier={tier} label={t(GUIDE_TIERS[tier].labelKey)} />
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {t(GUIDE_TIERS[tier].descKey)}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Steps — the field-by-field checklist, one accordion per step */}
      <Section id="steps" muted>
        <Container>
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {t("forCreators.steps.title")}
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mt-3 max-w-3xl text-muted-foreground">{t("forCreators.steps.subtitle")}</p>
          </Reveal>

          <div className="mt-12 space-y-14">
            {GUIDE_STEPS.map((step, stepIdx) => {
              const rows: DisclosureRow[] = step.fields.map((field) => {
                const example = field.exampleKey ? t(field.exampleKey) : null;
                return {
                  id: field.id,
                  // Keyed because these elements travel to the client inside the
                  // `rows` array: React treats them as list children and warns
                  // without one, even though they sit in object fields.
                  title: (
                    <span key={`${field.id}-title`} className="flex flex-wrap items-center gap-3">
                      <span className="font-semibold text-foreground">{fieldLabel(t(field.labelKey))}</span>
                      <TierBadge tier={field.tier} label={t(GUIDE_TIERS[field.tier].labelKey)} />
                    </span>
                  ),
                  content: (
                    <div key={`${field.id}-content`}>
                      <p>{t(field.descKey)}</p>
                      {example ? (
                        <p className="mt-2">
                          <span className="font-medium text-foreground">
                            {t("forCreators.exampleLabel")}
                            {labelSep(locale)}
                          </span>{" "}
                          {example}
                        </p>
                      ) : null}
                    </div>
                  ),
                };
              });

              return (
                <Reveal key={step.id} delay={0.15 + stepIdx * 0.08}>
                  <div id={step.id} className="scroll-mt-24">
                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
                        {stepIdx + 1}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-foreground">{t(step.titleKey)}</h2>
                        <p className="mt-2 text-sm text-muted-foreground">{t(step.subtitleKey)}</p>
                      </div>
                    </div>

                    <div className="mt-6 pl-16 max-sm:pl-0">
                      <DisclosureList
                        rows={rows}
                        expandAllLabel={t("forCreators.expandAll")}
                        collapseAllLabel={t("forCreators.collapseAll")}
                      />
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </Section>

      {/* File requirements — compact reference table */}
      <Section>
        <Container>
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {t("forCreators.fileReq.title")}
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mt-3 max-w-3xl text-muted-foreground">{t("forCreators.fileReq.subtitle")}</p>
          </Reveal>

          <Reveal delay={0.16}>
            {/* overflow-x-auto keeps a wide table inside its own box at
                375px instead of stretching the page (audit checklist). */}
            <div className="mt-8 overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-section text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">{t("forCreators.fileReq.col.type")}</th>
                    <th className="px-4 py-3 font-medium">{t("forCreators.fileReq.col.ratio")}</th>
                    <th className="px-4 py-3 font-medium">{t("forCreators.fileReq.col.maxSize")}</th>
                    <th className="px-4 py-3 font-medium">{t("forCreators.fileReq.col.formats")}</th>
                    <th className="px-4 py-3 font-medium">{t("forCreators.fileReq.col.consequence")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {FILE_REQUIREMENTS.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-3 font-medium text-foreground">{t(row.typeLabelKey)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.ratio}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.maxSize}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.formats}</td>
                      <td className="px-4 py-3 text-muted-foreground">{t(row.consequenceKey)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 max-w-3xl text-sm text-muted-foreground">
              {t("forCreators.fileReq.videoLink.note")}
            </p>
          </Reveal>
        </Container>
      </Section>

      {/* Example of a filled-in project — only when it still resolves as a
          live, approved project (see EXAMPLE_PROJECT_ID above). */}
      {exampleProject ? (
        <Section muted>
          <Container>
            <Reveal>
              <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                {t("forCreators.example.title")}
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="mt-3 max-w-3xl text-muted-foreground">{t("forCreators.example.subtitle")}</p>
            </Reveal>

            <Reveal delay={0.16}>
              <Link
                href={`/reports/${exampleProject.id}`}
                className="mt-8 flex max-w-2xl flex-col gap-4 rounded-2xl border border-border bg-card p-4 card-lift sm:flex-row sm:items-center"
              >
                <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg sm:w-64">
                  {exampleProject.poster ? (
                    <Image
                      src={mediaUrl(exampleProject.poster)}
                      alt={exampleProject.title}
                      fill
                      className="object-cover"
                      sizes="256px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                      <Film className="h-8 w-8 text-primary/40" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-semibold text-foreground">{exampleProject.title}</p>
                  <p className="mt-2 text-sm font-medium text-primary">{t("forCreators.example.cta")}</p>
                </div>
              </Link>
            </Reveal>
          </Container>
        </Section>
      ) : null}

      {/* What's next: moderation */}
      <Section muted>
        <Container>
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {t("forCreators.moderation.title")}
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mt-3 max-w-3xl text-muted-foreground">{t("forCreators.moderation.subtitle")}</p>
          </Reveal>

          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {MODERATION_STEPS.map((step, idx) => (
              <Reveal key={step.titleKey} delay={0.15 + idx * 0.08}>
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {idx + 1}
                  </div>
                  <h3 className="mt-4 font-semibold text-foreground">{t(step.titleKey)}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{t(step.descKey)}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.5}>
            <div className="mt-14 max-w-3xl rounded-2xl border border-border bg-card p-8">
              <h3 className="font-semibold text-foreground">{t("forCreators.moderation.reasons.title")}</h3>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {REASON_KEYS.map((key) => (
                  <li key={key} className="flex gap-2">
                    <span aria-hidden="true">•</span>
                    <span>{t(key)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.58}>
            <p className="mt-8 max-w-3xl rounded-xl border border-warn/30 bg-warn/10 px-6 py-4 text-sm text-amber-700">
              {t("forCreators.moderation.editWarning")}
            </p>
          </Reveal>
        </Container>
      </Section>

      {/* Final CTA */}
      <Section>
        <Container>
          <div className="mx-auto max-w-2xl">
            <Reveal>
              <div className="rounded-2xl border border-primary/20 bg-primary/5 px-8 py-12 text-center">
                <h2 className="text-2xl font-bold text-foreground">{t("forCreators.finalCta.title")}</h2>
                <p className="mt-4 text-muted-foreground">{t("forCreators.finalCta.subtitle")}</p>

                <div className="mt-8 flex justify-center">
                  <Button asChild variant="primary" size="md">
                    <Link href={submitHref}>{t("forCreators.finalCta.button")}</Link>
                  </Button>
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      <Footer locale={locale} currency={currency} />
    </>
  );
}
