"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useReportInterest } from "@/components/report/report-interest-context";

/** The apply button inside the hero's deal card.
 *
 *  Same viewer branching as OfferApplyButton, with one difference: this one
 *  keeps rendering when the project is archived, as a disabled "offers are
 *  closed". On an offer card that would be nine disabled buttons repeating the
 *  same sentence; here it is the one place a brand looks first, and an empty
 *  space where the button was reads as a page that failed to load.
 *
 *  Names no particular offer — the popup opens with nothing preselected and
 *  the brand picks in it, exactly like the button in the facts block. */
export function DealCta({ label }: { label: string }) {
  const { archived, archivedLabel, viewer, loginHref, openDialog } = useReportInterest();

  if (archived) {
    return (
      <Button
        type="button"
        variant="secondary"
        size="lg"
        disabled
        className="no-print h-auto min-h-12 w-full whitespace-normal break-words py-2 text-center leading-tight"
      >
        {archivedLabel}
      </Button>
    );
  }

  // A creator looking at their own project, or staff previewing it, has
  // nothing to apply for — the card above still shows them the price, the
  // free slots and the deadline, which is what they came to check.
  if (viewer === "none") return null;

  // no-print: the page prints as a media kit, and a button is dead ink on
  // paper — same treatment the offer cards' buttons get.
  const className = "no-print h-auto min-h-12 w-full whitespace-normal break-words py-2 text-center leading-tight";

  if (viewer === "guest") {
    return (
      <Button asChild variant="primary" size="lg" className={className}>
        <Link href={loginHref()}>{label}</Link>
      </Button>
    );
  }

  return (
    <Button type="button" variant="primary" size="lg" className={className} onClick={() => openDialog()}>
      {label}
    </Button>
  );
}
