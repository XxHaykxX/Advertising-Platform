import { notFound } from "next/navigation";
import { getProject, getProjectIds } from "@/lib/data/projects";
import { getLocale } from "@/lib/data/locale";
import { getCurrency } from "@/lib/data/currency";
import { isArchived } from "@/lib/data/format";
import { getSiteHeaderUser } from "@/lib/data/site-header-user";
import { getBrandInterestStatus } from "@/lib/data/brand-interests";
import { prisma } from "@/lib/prisma";
import { loadCurrentUser } from "@/lib/auth/require";
import { isStaff } from "@/lib/auth/permissions";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ReportHero } from "@/components/report/report-hero";
import { KeyFacts } from "@/components/report/key-facts";
import { Cast } from "@/components/report/cast";
import { ProductPlacements } from "@/components/report/product-placements";
import { Sponsors } from "@/components/report/sponsors";
import { ProductionTimeline } from "@/components/report/production-timeline";
import { ReportInterestProvider } from "@/components/report/report-interest-context";
import { ViewPing } from "@/components/report/view-ping";
import { ReportTabs } from "./report-tabs";

export async function generateStaticParams() {
  const ids = await getProjectIds();
  return ids.map((id) => ({ id: String(id) }));
}

export const dynamicParams = true;

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pid = Number(id);
  if (!Number.isInteger(pid)) notFound();

  const locale = await getLocale();
  const currency = await getCurrency();
  // authed is needed before the getProject call (to pick activeOnly), so it
  // can't join the same Promise.all as the project fetch below.
  const [user, authed] = await Promise.all([getSiteHeaderUser(), loadCurrentUser()]);
  // Audit 3.2: a moderator/content-editor reviewing the moderation queue
  // links here to preview the project before approving/rejecting it — but
  // getProject's activeOnly=true gate (isActive && APPROVED) would 404 on
  // exactly the PENDING/REJECTED/DRAFT projects that queue exists for.
  // Bypass the gate for staff who can moderate or edit content; everyone
  // else keeps the public "approved only" behavior.
  // Any staff account may preview an unapproved project — a moderator to
  // judge it, a publisher to fix it, a translator to read the copy where it
  // actually sits. The creator who submitted it may see their own in any
  // status: they wrote it, and after a rejection they need to look at what
  // they sent in order to fix it. Everyone else — other members and guests —
  // keeps the public "approved only" behaviour and gets a 404.
  const ownsThis =
    authed != null &&
    (await prisma.project.findFirst({ where: { id: pid, ownerId: authed.id }, select: { id: true } })) !=
      null;
  const canPreviewUnapproved = authed != null && (isStaff(authed.role) || ownsThis);
  const project = await getProject(pid, locale, currency, !canPreviewUnapproved);
  if (!project) notFound();

  const interestStatus =
    authed?.role === "BRAND" ? await getBrandInterestStatus(authed.id, pid) : null;
  // The application now requires a phone number (owner decision 2026-07-26 —
  // the seller has to be able to call back). Seeded from the brand's profile
  // so a returning buyer doesn't retype it.
  const brandPhone =
    authed?.role === "BRAND"
      ? ((await prisma.user.findUnique({ where: { id: authed.id }, select: { phone: true } }))?.phone ?? "")
      : "";

  return (
    <ReportInterestProvider
      projectId={project.id}
      initialStatus={interestStatus}
      // The application popup asks what the brand wants (audit 2.3). Product
      // placements lead the list — that is the offer a brand comes here for;
      // sponsorship follows. Prices go in as AMD, the currency the creator set:
      // applying "for €5 988" would name a figure that reads differently
      // tomorrow. The converted amount rides along as an aside, and only when
      // the visitor is actually browsing in something else.
      offers={[
        ...project.placements.map((p) => ({
          id: p.id,
          kind: "PLACEMENT" as const,
          name: p.title,
          priceNative: p.priceNative,
          priceConverted: currency === "AMD" ? null : p.priceDisplay,
          availableSlots: p.availableSlots,
        })),
        ...project.tiers.map((tier) => ({
          id: tier.id,
          kind: "TIER" as const,
          name: tier.name,
          priceNative: tier.priceNative,
          priceConverted: currency === "AMD" ? null : tier.priceDisplay,
          availableSlots: tier.availableSlots,
        })),
      ]}
      locale={locale}
      brandPhone={brandPhone}
      // Past its placement deadline the project is archived: it drops out of
      // the catalog, but this page stays reachable by direct link (a brand may
      // have bookmarked it) with the offer button closed instead.
      archived={isArchived(project.applicationDeadline)}
    >
      {/* Counts this visit for the owner's stats — see the component. */}
      <ViewPing projectId={project.id} />
      <Header user={user} locale={locale} currency={currency} />
      <ReportTabs hasCast={project.actors.length > 0} locale={locale} />
      <div id="overview">
        <ReportHero project={project} locale={locale} />
        {/* The video now leads the hero slider (first slide) — see ReportHero /
            PosterSlider. The standalone ReportVideo section was removed so it
            isn't shown twice (user request 2026-07-25). */}
        <KeyFacts project={project} locale={locale} user={user} />
      </div>
      <ProductionTimeline project={project} locale={locale} />
      <Cast project={project} locale={locale} />
      {/* Product placement first — that's what a brand comes here for;
          sponsorship (logo on promo, credits) is the second offer. */}
      <ProductPlacements project={project} locale={locale} />
      <Sponsors project={project} locale={locale} />
      <Footer locale={locale} currency={currency} />
    </ReportInterestProvider>
  );
}
