"use client";

import { Check, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useReportInterest } from "@/components/report/report-interest-context";

/** Express Interest trigger for the report page (#23) — clicking it always
 *  opens the shared ApplicationDialog (via ReportInterestContext) instead of
 *  instant-toggling; once an application exists (`applied`), it just relabels
 *  to "already sent" but stays clickable so the brand can resubmit with a new
 *  message. The open/applied state is shared between this page's two
 *  instances (key-facts + the ROI banner) so both reflect the same outcome
 *  and open the same popup. */
/** min-h-12, not the min-h-9 this started at: `h-auto` drops the lg variant's
 *  own height, and at min-h-9 the button came out a third shorter than every
 *  other lg button on the page. h-auto still lets a wrapped label push it
 *  taller. */
const BUTTON_CLASS =
  "h-auto min-h-12 w-full min-w-0 max-w-full whitespace-normal break-words py-2 text-center leading-tight lg:w-auto";

export function ReportInterestButton({
  labelIdle,
  labelSent,
}: {
  labelIdle: string;
  labelSent: string;
}) {
  const { applied, archived, archivedLabel, openDialog } = useReportInterest();

  // Past its placement deadline the project is in the archive: the page still
  // reads, but there is nothing left to apply to.
  if (archived) {
    return (
      <div className="flex w-full flex-col gap-1 lg:w-auto">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          disabled
          className={BUTTON_CLASS}
        >
          {archivedLabel}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-1 lg:w-auto">
      <Button
        type="button"
        variant={applied ? "secondary" : "primary"}
        size="lg"
        className={cn(BUTTON_CLASS, "gap-1.5")}
        // Wrapped: openDialog now takes an optional offer to preselect, and the
        // click event must not be passed as one. This page-level button names
        // no particular card, so the popup opens with nothing chosen.
        onClick={() => openDialog()}
      >
        {applied ? <Check className="h-3.5 w-3.5" /> : <Heart className="h-3.5 w-3.5" />}
        {applied ? labelSent : labelIdle}
      </Button>
    </div>
  );
}
