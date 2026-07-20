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
export function ReportInterestButton({
  labelIdle,
  labelSent,
}: {
  labelIdle: string;
  labelSent: string;
}) {
  const { applied, openDialog } = useReportInterest();

  return (
    <div className="flex w-full flex-col gap-1 lg:w-auto">
      <Button
        type="button"
        variant={applied ? "secondary" : "primary"}
        size="lg"
        className={cn(
          "h-auto min-h-9 w-full min-w-0 max-w-full whitespace-normal break-words py-2 text-center leading-tight lg:w-auto",
          "gap-1.5",
        )}
        onClick={openDialog}
      >
        {applied ? <Check className="h-3.5 w-3.5" /> : <Heart className="h-3.5 w-3.5" />}
        {applied ? labelSent : labelIdle}
      </Button>
    </div>
  );
}
