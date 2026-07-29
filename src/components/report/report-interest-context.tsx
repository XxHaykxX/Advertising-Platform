"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { InterestStatus } from "@prisma/client";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";
import { ApplicationDialog, type ApplicationOffer } from "@/components/report/application-dialog";
import { NO_OFFER_KEY } from "@/lib/offer-value";

/** Shared Express Interest state for the report page (#23) — the page renders
 *  TWO buttons (key-facts up top, the ROI banner further down) that must
 *  agree on whether an application has been sent, and both need to open the
 *  SAME popup rather than each mounting its own. `applied` seeds from
 *  whatever Interest row already existed (getBrandInterestStatus in
 *  page.tsx) and flips true the moment the popup's submitApplication call
 *  succeeds — the dialog itself is mounted once, here, so either button's
 *  openDialog() opens the one instance. */
type ReportInterestContextValue = {
  /** The brand has applied for something on this project. */
  applied: boolean;
  /** …and specifically for this offer ("P:5" / "T:3"). Since 2026-07-29 an
   *  application belongs to one offer, so a card can say "sent" while its
   *  neighbours still say "apply", and the popup only warns about replacing
   *  what is actually going to be replaced. */
  appliedTo: (offer: string) => boolean;
  isOpen: boolean;
  /** The placement deadline has passed, so the project no longer takes offers.
   *  The report page itself stays reachable by direct link — only the action
   *  is closed. */
  archived: boolean;
  /** Localized copy for the disabled button, resolved here so the button stays
   *  free of the report page's translation plumbing. */
  archivedLabel: string;
  /** Who is looking. Every offer card now carries its own apply button, and
   *  what that button is depends on the viewer: a brand opens the popup, a
   *  guest is sent to sign in and brought back, and a creator or staff member
   *  — who cannot apply to anything — is shown nothing at all. */
  viewer: ReportViewer;
  /** Where a guest goes to sign in, with this page as the return target. The
   *  offer they clicked rides along so the popup reopens on it. */
  loginHref: (offer?: string) => string;
  /** `offer` is an offerValue ("P:5" / "T:3") — the card the visitor clicked,
   *  preselected in the popup's picker. Omitted by the page-level buttons,
   *  which open the popup with nothing chosen. */
  openDialog: (offer?: string) => void;
  closeDialog: () => void;
  /** Records that an application now exists for `offer` (default: the
   *  "no particular offer" slot). */
  markApplied: (offer?: string) => void;
};

/** The three states an offer card's button can be in. Anything that is not a
 *  brand or a guest ("none") gets no button: a creator looking at their own
 *  project, or staff previewing it, have nothing to apply for. */
export type ReportViewer = "brand" | "guest" | "none";

/** Query parameter that survives the sign-in round trip: /reports/34?offer=P:5
 *  reopens the popup on placement 5 the moment the brand lands back here, so
 *  the intent isn't lost at the login wall (owner decision 2026-07-29). */
export const OFFER_QUERY_PARAM = "offer";

const ReportInterestContext = createContext<ReportInterestContextValue | null>(null);

export function ReportInterestProvider({
  projectId,
  appliedOffers = {},
  offers = [],
  locale = DEFAULT_LOCALE,
  brandPhone = "",
  archived = false,
  viewer = "none",
  children,
}: {
  projectId: number;
  /** offerKey -> status for the applications this brand already holds here
   *  (getBrandInterestOffers). Empty for anyone who is not a brand. */
  appliedOffers?: Record<string, InterestStatus>;
  /** Resolved on the server from the session — see ReportViewer. */
  viewer?: ReportViewer;
  /** Placement deadline is behind us (see isArchived) — offers are closed. */
  archived?: boolean;
  /** Passed straight through to the popup's picker (audit 2.3) — product
   *  placements and sponsorship packages in one list since 2026-07-29. */
  offers?: ApplicationOffer[];
  locale?: Locale;
  /** The brand's phone from its profile, seeding the popup's required phone
   *  field so a returning buyer doesn't retype it. */
  brandPhone?: string;
  children: React.ReactNode;
}) {
  // Which offers already carry an application. Seeded from the server and
  // extended in place when one is sent, so the card that was just applied for
  // relabels itself without a reload — and its neighbours don't.
  const [sentOffers, setSentOffers] = useState<Set<string>>(
    () => new Set(Object.keys(appliedOffers)),
  );
  const [isOpen, setIsOpen] = useState(false);
  /** offerValue the popup should open on, or "" for "let them choose". */
  const [preselected, setPreselected] = useState("");
  const t = makeUI(locale);

  // Coming back from the login wall: /reports/34?offer=P:5 reopens the popup
  // on the card the guest clicked before signing in. The parameter is wiped
  // from the URL right away so a reload — or a shared link — doesn't reopen
  // it, and so the address bar stays clean.
  useEffect(() => {
    const url = new URL(window.location.href);
    const wanted = url.searchParams.get(OFFER_QUERY_PARAM);
    if (!wanted) return;
    // Stripped for everyone, not just the brand it was meant for: a guest or a
    // creator who follows such a link would otherwise keep the parameter in
    // the address bar and pass it on when sharing.
    url.searchParams.delete(OFFER_QUERY_PARAM);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    if (archived || viewer !== "brand") return;
    // Only an offer this project actually sells — a hand-typed id must not
    // open a popup preselected on somebody else's placement.
    if (!offers.some((o) => `${o.kind === "PLACEMENT" ? "P" : "T"}:${o.id}` === wanted)) return;
    setPreselected(wanted);
    setIsOpen(true);
    // offers is a fresh array on every render; the effect is meant to run once
    // on mount, when the URL is read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [archived, viewer]);

  const value: ReportInterestContextValue = {
    applied: sentOffers.size > 0,
    appliedTo: (offer) => sentOffers.has(offer),
    isOpen,
    archived,
    archivedLabel: t("report.offersClosed"),
    viewer,
    loginHref: (offer) =>
      `/login?from=${encodeURIComponent(
        offer ? `/reports/${projectId}?${OFFER_QUERY_PARAM}=${offer}` : `/reports/${projectId}`,
      )}`,
    // Guarded as well as disabled in the UI: the popup must not be reachable
    // for a project that has stopped taking offers.
    openDialog: (offer) => {
      if (archived) return;
      setPreselected(offer ?? "");
      setIsOpen(true);
    },
    closeDialog: () => setIsOpen(false),
    markApplied: (offer = NO_OFFER_KEY) =>
      setSentOffers((prev) => (prev.has(offer) ? prev : new Set(prev).add(offer))),
  };

  return (
    <ReportInterestContext.Provider value={value}>
      {children}
      {isOpen ? (
        <ApplicationDialog
          projectId={projectId}
          offers={offers}
          initialOffer={preselected}
          // The offers this brand has already applied for — the popup warns
          // only when the one currently picked is among them, since that is
          // the only application a send can replace.
          appliedOffers={sentOffers}
          brandPhone={brandPhone}
          t={t}
          onClose={() => setIsOpen(false)}
          // The popup reports WHICH offer was sent, so only that card flips to
          // "already sent" — applying for one placement must not read as all
          // nine being taken.
          onSubmitted={(offer) => value.markApplied(offer)}
        />
      ) : null}
    </ReportInterestContext.Provider>
  );
}

export function useReportInterest(): ReportInterestContextValue {
  const ctx = useContext(ReportInterestContext);
  if (!ctx) throw new Error("useReportInterest must be used within a ReportInterestProvider");
  return ctx;
}
