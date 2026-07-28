"use client";

import { createContext, useContext, useState } from "react";
import type { InterestStatus } from "@prisma/client";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";
import { ApplicationDialog, type ApplicationOffer } from "@/components/report/application-dialog";

/** Shared Express Interest state for the report page (#23) — the page renders
 *  TWO buttons (key-facts up top, the ROI banner further down) that must
 *  agree on whether an application has been sent, and both need to open the
 *  SAME popup rather than each mounting its own. `applied` seeds from
 *  whatever Interest row already existed (getBrandInterestStatus in
 *  page.tsx) and flips true the moment the popup's submitApplication call
 *  succeeds — the dialog itself is mounted once, here, so either button's
 *  openDialog() opens the one instance. */
type ReportInterestContextValue = {
  applied: boolean;
  isOpen: boolean;
  /** The placement deadline has passed, so the project no longer takes offers.
   *  The report page itself stays reachable by direct link — only the action
   *  is closed. */
  archived: boolean;
  /** Localized copy for the disabled button, resolved here so the button stays
   *  free of the report page's translation plumbing. */
  archivedLabel: string;
  openDialog: () => void;
  closeDialog: () => void;
  markApplied: () => void;
};

const ReportInterestContext = createContext<ReportInterestContextValue | null>(null);

export function ReportInterestProvider({
  projectId,
  initialStatus,
  offers = [],
  locale = DEFAULT_LOCALE,
  brandPhone = "",
  archived = false,
  children,
}: {
  projectId: number;
  initialStatus: InterestStatus | null;
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
  const [applied, setApplied] = useState(initialStatus !== null);
  const [isOpen, setIsOpen] = useState(false);
  const t = makeUI(locale);

  const value: ReportInterestContextValue = {
    applied,
    isOpen,
    archived,
    archivedLabel: t("report.offersClosed"),
    // Guarded as well as disabled in the UI: the popup must not be reachable
    // for a project that has stopped taking offers.
    openDialog: () => {
      if (archived) return;
      setIsOpen(true);
    },
    closeDialog: () => setIsOpen(false),
    markApplied: () => setApplied(true),
  };

  return (
    <ReportInterestContext.Provider value={value}>
      {children}
      {isOpen ? (
        <ApplicationDialog
          projectId={projectId}
          offers={offers}
          brandPhone={brandPhone}
          t={t}
          onClose={() => setIsOpen(false)}
          onSubmitted={() => setApplied(true)}
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
