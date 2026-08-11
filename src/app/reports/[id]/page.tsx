import { notFound } from "next/navigation";
import { getProject, getProjectIds } from "@/lib/data/projects";
import { getLocale } from "@/lib/data/locale";
import { getCurrency } from "@/lib/data/currency";
import { daysUntil, isArchived } from "@/lib/data/format";
import { getSiteHeaderUser } from "@/lib/data/site-header-user";
import { getBrandInterestOffers } from "@/lib/data/brand-interests";
import { prisma } from "@/lib/prisma";
import { loadCurrentUser } from "@/lib/auth/require";
import { isStaff } from "@/lib/auth/permissions";
import { canBuy } from "@/lib/auth/capabilities";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ReportHero } from "@/components/report/report-hero";
import { KeyFacts } from "@/components/report/key-facts";
import { Cast } from "@/components/report/cast";
import { ProductPlacements } from "@/components/report/product-placements";
import { Sponsors } from "@/components/report/sponsors";
import { ProductionTimeline } from "@/components/report/production-timeline";
import {
  ReportInterestProvider,
  type ReportViewer,
} from "@/components/report/report-interest-context";
import { StickyOfferBar } from "@/components/report/sticky-offer-bar";
import { ViewPing } from "@/components/report/view-ping";
import { makeUI } from "@/lib/i18n";
import { slotsLabelKey } from "@/lib/plural";

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
  // IA-30/36: a brand that already applied here must be able to reopen what
  // it applied for even after the creator unpublishes the project — otherwise
  // an accepted deal becomes literally unreachable to the brand that holds
  // it. Scoped to that brand's own Interest on this exact project, so no
  // other member borrows the door; only ever queried for a signed-in BRAND
  // (guests, the common case, and every other role skip it entirely).
  // Favorite is deliberately left out of this exception — it's just a
  // bookmark, never vetted by anyone, and carries none of the "this brand was
  // let past the gate" evidence an Interest does.
  // moderationStatus is a separate axis and is NOT bypassed: a brand can only
  // ever apply while a project is APPROVED (the apply button never shows
  // otherwise), and nothing in the moderation queue moves an already-APPROVED
  // project back to PENDING/REJECTED, so this is defense in depth rather than
  // a real path — but it means a rejected project stays a 404 for the brand
  // too, same as for everyone but staff and the owner.
  const myInterest =
    authed != null && canBuy(authed)
      ? await prisma.interest.findFirst({
          where: { brandId: authed.id, projectId: pid },
          select: { project: { select: { moderationStatus: true, isActive: true } } },
        })
      : null;
  const hasInterestHere = myInterest?.project.moderationStatus === "APPROVED";
  const project = await getProject(pid, locale, currency, !(canPreviewUnapproved || hasInterestHere));
  if (!project) notFound();

  // Offer -> status for everything this brand has already applied for here.
  // Per offer, not per project: a brand can hold an accepted deal on one
  // placement and a fresh application on another, so "have you applied?" only
  // has an answer once you say what for.
  const appliedOffers =
    authed != null && canBuy(authed) ? await getBrandInterestOffers(authed.id, pid) : {};
  // The application now requires a phone number (owner decision 2026-07-26 —
  // the seller has to be able to call back). Seeded from the brand's profile
  // so a returning buyer doesn't retype it.
  const brandPhone =
    authed != null && canBuy(authed)
      ? ((await prisma.user.findUnique({ where: { id: authed.id }, select: { phone: true } }))?.phone ?? "")
      : "";

  const t = makeUI(locale);

  // Who is looking decides what every offer card's button is: a brand opens
  // the application popup, a guest is sent to sign in and brought back to the
  // same card, and a creator, staff member, or the project's own owner — who
  // has nothing to apply for — is shown no button at all. `ownsThis` is
  // already computed above; reusing it here is what keeps a dual member from
  // seeing an Apply button on their own listing (2026-08-11), at no extra
  // query.
  const viewer: ReportViewer =
    authed == null ? "guest" : canBuy(authed) && !ownsThis ? "brand" : "none";

  // Summary for the sticky bar (audit C3): a brand shouldn't have to read nine
  // cards to learn the entry price and what is still free. Placements and
  // packages are summed together — both are "a placement in this project" from
  // the buyer's side. Deliberately no view or application counts: on a young
  // marketplace small numbers argue against the seller (owner decision).
  const pricedOffers = [
    ...project.placements
      .filter((p) => p.priceAmd != null && p.priceAmd > 0 && p.priceDisplay != null)
      .map((p) => ({ amd: p.priceAmd as number, display: p.priceDisplay as string })),
    ...project.tiers
      .filter((tier) => tier.priceAmd != null && tier.priceAmd > 0 && tier.priceDisplay != null)
      .map((tier) => ({ amd: tier.priceAmd as number, display: tier.priceDisplay as string })),
  ];
  const cheapestOffer = pricedOffers.reduce<{ amd: number; display: string } | null>(
    (min, offer) => (min == null || offer.amd < min.amd ? offer : min),
    null,
  );
  const allOffers = [...project.placements, ...project.tiers];
  // Only rows where the creator actually set a total count toward the summary;
  // an unspecified slot count is not "zero free".
  const slotsTotal = allOffers.reduce((sum, o) => sum + (o.totalSlots ?? 0), 0);
  const slotsFree = allOffers.reduce(
    (sum, o) =>
      sum +
      // Clamped to the total: the editors don't tie availableSlots to
      // totalSlots, so a row saved as "14 free of 11" would otherwise print
      // more free slots than exist.
      (o.totalSlots != null && o.totalSlots > 0
        ? Math.min(o.availableSlots ?? 0, o.totalSlots)
        : 0),
    0,
  );

  const hasOffer = allOffers.length > 0;

  return (
    <ReportInterestProvider
      projectId={project.id}
      appliedOffers={appliedOffers}
      viewer={viewer}
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
      // have bookmarked it) with the offer button closed instead. Same
      // treatment when the brand only got in on the hasInterestHere exception
      // above because the creator unpublished the project after the brand
      // applied — it must read as closed, not invite a fresh application to a
      // project no longer on sale.
      archived={
        isArchived(project.applicationDeadline, project.applicationDeadlineOngoing) ||
        (hasInterestHere && myInterest?.project.isActive === false)
      }
    >
      {/* Counts this visit for the owner's stats — see the component. */}
      <ViewPing projectId={project.id} />
      <Header user={user} locale={locale} currency={currency} />
      {/* Anchor targets for #overview/#production/#team/#offer links (e.g.
          from the sticky offer bar's own deep links, or shared URLs).
          `scroll-mt-24` clears the sticky site header (64px, `top-0`) with
          the same breathing room the admin form's own anchored sections use
          — otherwise a jump parks the section heading right under the fixed
          header, and on the offer section, the apply buttons with it (audit
          A3). Wrapper ids are used rather than the sections' own
          (`#placements`, `#sponsors`, `#cast`) so the two offer sections can
          share one target and no id is defined twice. */}
      <div id="overview" className="scroll-mt-24">
        <ReportHero
          project={project}
          // The same summary the sticky bar gets — the hero's deal card is
          // what a brand sees before either of them scrolls into view.
          deal={{
            fromPrice: cheapestOffer?.display ?? null,
            slotsFree,
            slotsTotal,
            daysLeft: daysUntil(project.applicationDeadline),
          }}
          locale={locale}
        />
        {/* The video now leads the hero slider (first slide) — see ReportHero /
            PosterSlider. The standalone ReportVideo section was removed so it
            isn't shown twice (user request 2026-07-25). */}
        {/* No `user` prop any more: the block's apply button was a duplicate of
            the deal card's own CTA and was removed on 2026-08-05, and it was
            the only thing here that cared who was looking. */}
        <KeyFacts project={project} locale={locale} />
      </div>
      <div id="production" className="scroll-mt-24">
        <ProductionTimeline project={project} locale={locale} />
      </div>
      <div id="team" className="scroll-mt-24">
        <Cast project={project} locale={locale} />
      </div>
      {/* pb: the sticky bar is fixed to the viewport bottom, so without room
          reserved under the last section it covers ~73px of it — on a phone
          that is the top of an offer card, which reads as content cut off.
          --offer-bar-h is published by the bar itself and is 0px whenever it
          is hidden, so nothing is reserved when nothing is there. */}
      <div id="offer" className="scroll-mt-24 pb-[var(--offer-bar-h,0px)]">
        {/* Product placement first — that's what a brand comes here for;
            sponsorship (logo on promo, credits) is the second offer. */}
        <ProductPlacements project={project} locale={locale} />
        <Sponsors project={project} locale={locale} />
      </div>
      {hasOffer ? (
        <StickyOfferBar
          fromLabel={
            cheapestOffer ? t("report.offerBarFrom", { price: cheapestOffer.display }) : null
          }
          slotsLabel={
            slotsTotal > 0
              ? t(slotsLabelKey(locale, slotsTotal), { free: slotsFree, total: slotsTotal })
              : null
          }
          ctaLabel={t("report.offerBarCta")}
        />
      ) : null}
      <Footer locale={locale} currency={currency} />
    </ReportInterestProvider>
  );
}
