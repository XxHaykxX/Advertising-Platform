"use client";

import { useState } from "react";
import { Check, Heart, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useReportInterest } from "@/components/report/report-interest-context";

/** Express Interest toggle for the report page (IA-6) — same button as
 *  browse-view.tsx's ExpressInterestButton, but the sent/pending/error state
 *  is shared (via ReportInterestContext) between this page's two instances
 *  (key-facts + the ROI banner) instead of living locally, so a click on
 *  either one updates both immediately. Only the hover state (icon/label
 *  swap on the already-sent button) stays local — it's purely per-button UI. */
export function ReportInterestButton({
  labelIdle,
  labelSent,
  labelRemove,
  errorMessage,
}: {
  labelIdle: string;
  labelSent: string;
  labelRemove: string;
  errorMessage: string;
}) {
  const { status, pending, error, toggle } = useReportInterest();
  const [hover, setHover] = useState(false);
  const alreadySent = status !== null;

  // No items-* alignment override here — the two call sites need different
  // alignment (key-facts: right-aligned column; the ROI banner: centered), so
  // this wrapper just mirrors the button's own w-full/lg:w-auto footprint and
  // lets each parent's own items-end/items-center position it.
  return (
    <div className="flex w-full flex-col gap-1 lg:w-auto">
      <Button
        type="button"
        variant={alreadySent ? "secondary" : "primary"}
        size="lg"
        disabled={pending}
        className={cn(
          "h-auto min-h-9 w-full min-w-0 max-w-full whitespace-normal break-words py-2 text-center leading-tight lg:w-auto",
          "gap-1.5",
          alreadySent && hover && "border-danger/40 text-danger",
        )}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => toggle(errorMessage)}
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : alreadySent ? (
          hover ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />
        ) : (
          <Heart className="h-3.5 w-3.5" />
        )}
        {alreadySent ? (hover ? labelRemove : labelSent) : labelIdle}
      </Button>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
