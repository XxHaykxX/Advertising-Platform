"use client";

import { createContext, useContext, useState } from "react";
import type { InterestStatus } from "@prisma/client";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";
import { ApplicationDialog } from "@/components/report/application-dialog";

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
  openDialog: () => void;
  closeDialog: () => void;
  markApplied: () => void;
};

const ReportInterestContext = createContext<ReportInterestContextValue | null>(null);

export function ReportInterestProvider({
  projectId,
  initialStatus,
  locale = DEFAULT_LOCALE,
  children,
}: {
  projectId: number;
  initialStatus: InterestStatus | null;
  locale?: Locale;
  children: React.ReactNode;
}) {
  const [applied, setApplied] = useState(initialStatus !== null);
  const [isOpen, setIsOpen] = useState(false);
  const t = makeUI(locale);

  const value: ReportInterestContextValue = {
    applied,
    isOpen,
    openDialog: () => setIsOpen(true),
    closeDialog: () => setIsOpen(false),
    markApplied: () => setApplied(true),
  };

  return (
    <ReportInterestContext.Provider value={value}>
      {children}
      {isOpen ? (
        <ApplicationDialog
          projectId={projectId}
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
