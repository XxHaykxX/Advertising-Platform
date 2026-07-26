import { notFound } from "next/navigation";
import { getProject, getProjectIds } from "@/lib/data/projects";
import { getLocale } from "@/lib/data/locale";
import { getCurrency } from "@/lib/data/currency";
import { getSiteHeaderUser } from "@/lib/data/site-header-user";
import { getBrandInterestStatus } from "@/lib/data/brand-interests";
import { prisma } from "@/lib/prisma";
import { loadCurrentUser } from "@/lib/auth/require";
import { canEditContent, canModerate } from "@/lib/auth/permissions";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ReportHero } from "@/components/report/report-hero";
import { KeyFacts } from "@/components/report/key-facts";
import { Cast } from "@/components/report/cast";
import { Placements } from "@/components/report/placements";
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
  const canPreviewUnapproved =
    authed != null && (canModerate(authed.role) || canEditContent(authed.role));
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
      // The application popup asks which package the brand wants (audit 2.3).
      tiers={project.tiers.map((tier) => ({
        id: tier.id,
        name: tier.name,
        priceDisplay: tier.priceDisplay,
        availableSlots: tier.availableSlots,
      }))}
      locale={locale}
      brandPhone={brandPhone}
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
      <Placements project={project} locale={locale} />
      <Footer locale={locale} currency={currency} />
    </ReportInterestProvider>
  );
}
