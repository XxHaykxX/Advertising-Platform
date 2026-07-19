"use client";

import { createContext, useContext, useState, useTransition } from "react";
import type { InterestStatus } from "@prisma/client";
import { expressInterest, withdrawInterest } from "@/app/account/brand/actions";

/** Shared Express Interest state for the report page (IA-6 polish) — the page
 *  renders TWO buttons (key-facts up top, the ROI banner further down) that
 *  must agree on whether interest has been sent, so the toggle logic lives
 *  here once instead of duplicated per-button local state. Same "no
 *  emitInterestChanged, no reliance on revalidatePath" reasoning as before:
 *  expressInterest/withdrawInterest only revalidate /account/brand* paths, so
 *  this context flips its own `status` directly on success. */
type ReportInterestContextValue = {
  status: InterestStatus | null;
  pending: boolean;
  error: string | null;
  toggle: (errorMessage: string) => void;
};

const ReportInterestContext = createContext<ReportInterestContextValue | null>(null);

export function ReportInterestProvider({
  projectId,
  initialStatus,
  children,
}: {
  projectId: number;
  initialStatus: InterestStatus | null;
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<InterestStatus | null>(initialStatus);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const toggle = (errorMessage: string) => {
    const alreadySent = status !== null;
    startTransition(async () => {
      setError(null);
      const res = alreadySent ? await withdrawInterest(projectId) : await expressInterest(projectId);
      if (!res.ok) setError(res.error ?? errorMessage);
      else setStatus(alreadySent ? null : "SENT");
    });
  };

  return (
    <ReportInterestContext.Provider value={{ status, pending, error, toggle }}>
      {children}
    </ReportInterestContext.Provider>
  );
}

export function useReportInterest(): ReportInterestContextValue {
  const ctx = useContext(ReportInterestContext);
  if (!ctx) throw new Error("useReportInterest must be used within a ReportInterestProvider");
  return ctx;
}
