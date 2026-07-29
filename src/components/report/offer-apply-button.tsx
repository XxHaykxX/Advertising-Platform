"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useReportInterest } from "@/components/report/report-interest-context";

/** Apply CTA for a single offer card — a product placement or a sponsorship
 *  package (owner decision 2026-07-29): the page used to have exactly one
 *  apply button, buried in the facts block up top, so a brand that scrolled
 *  down to an offer had to scroll back up to act on it. `offer` is the
 *  offerValue ("P:5" / "T:3") of the card this button lives on, so opening
 *  the popup from here preselects it.
 *
 *  What renders depends on who is looking (ReportViewer): a creator or staff
 *  member previewing their own project has nothing to apply for, a guest is
 *  sent to sign in and back, and a brand gets the popup directly. */
export function OfferApplyButton({ offer, label }: { offer: string; label: string }) {
  const { archived, viewer, loginHref, openDialog } = useReportInterest();

  // The facts block up top already says offers are closed; nine more
  // disabled buttons repeating that on every card would just be noise.
  if (archived) return null;
  // Nothing for a creator or staff previewing their own project to apply to.
  if (viewer === "none") return null;

  // no-print: nine of these dot the page, one per offer card — the media-kit
  // print view has its own printable layout and doesn't need a CTA on it.
  //
  // h-auto + min-h-11, not a bare h-auto: dropping the size variant's fixed
  // height left the button as thin as its own line of text (~18px), a strip
  // rather than a button. min-h-11 restores the size the design gives every
  // other button on the page, and h-auto still lets it grow if the label ever
  // wraps to a second line.
  const className =
    "no-print h-auto min-h-11 w-full whitespace-normal break-words py-2 text-center leading-tight";

  if (viewer === "guest") {
    return (
      <Button asChild variant="primary" className={className}>
        <Link href={loginHref(offer)}>{label}</Link>
      </Button>
    );
  }

  // viewer === "brand" — the button stays the same even after an application
  // exists: applying for one placement must not read as "all nine are taken".
  return (
    <Button type="button" variant="primary" className={className} onClick={() => openDialog(offer)}>
      {label}
    </Button>
  );
}
