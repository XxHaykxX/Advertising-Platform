"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useReportInterest } from "@/components/report/report-interest-context";

/** Sticky "apply from anywhere" bar (audit A1b/C3) — the report page runs
 *  ~5600px long, so a brand scrolled past the hero has no CTA in view until
 *  they hunt for an offer card. This mounts once at the bottom of the page
 *  and surfaces the same action the hero already offers, without repeating
 *  its own copy of the viewer-branching logic — that lives in
 *  ReportInterestContext (see report-interest-button.tsx for the sibling). */
export function StickyOfferBar({
  fromLabel,
  slotsLabel,
  ctaLabel,
}: {
  /** "Starting at ֏2,500,000" — preformatted; null when no offer has a price. */
  fromLabel: string | null;
  /** "7 of 11 placements open" — preformatted; null when no offer has slots. */
  slotsLabel: string | null;
  ctaLabel: string;
}) {
  const { isOpen, archived, viewer, loginHref, openDialog } = useReportInterest();
  // Visible once the page has been scrolled past its own overview section, and
  // hidden again once the footer comes into view — otherwise the bar sits on
  // top of the footer and the floating notification bell (audit C3).
  const [pastOverview, setPastOverview] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);

  // Stays an effect: it queries the DOM and owns an IntersectionObserver.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const overview = document.getElementById("overview");
    // No overview section to scroll past — show the bar straight away rather
    // than waiting for an observer that will never fire.
    if (!overview) {
      setPastOverview(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      setPastOverview(!entry.isIntersecting);
    });
    observer.observe(overview);
    return () => observer.disconnect();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer) return;

    const observer = new IntersectionObserver(([entry]) => {
      setFooterVisible(entry.isIntersecting);
    });
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  // A creator/staff previewer or an archived project has nothing to apply
  // for — same rule the hero's own button follows.
  const hidden = viewer === "none" || archived;
  const visible = !hidden && pastOverview && !footerVisible && !isOpen;

  // Anything else anchored to the bottom of the viewport — today the push
  // notification prompt, which sits bottom-right exactly where this bar's own
  // button is — reads this and lifts itself clear. Kept in sync here rather
  // than duplicated as a scroll listener over there.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--offer-bar-h", visible ? "4.5rem" : "0px");
    return () => {
      root.style.removeProperty("--offer-bar-h");
    };
  }, [visible]);

  if (hidden) return null;

  return (
    <div
      // Translated off-screen is still IN the page: without `inert` the hidden
      // bar's button stays in the tab order and is announced by a screen
      // reader on every project page.
      inert={!visible}
      className={cn(
        // no-print: the page has a print view (the "Print" button in the
        // hero); a bar pinned to the viewport bottom would land in the middle
        // of a printed page.
        "no-print fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md transition-transform duration-300 ease-out motion-reduce:transition-none",
        visible ? "translate-y-0" : "pointer-events-none translate-y-full",
      )}
    >
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-4 px-6 py-3 max-sm:px-4">
        <div className="min-w-0">
          {fromLabel ? (
            // At >=390px the price used to truncate to "…որումը՝ …" — the lg
            // button (audit P9) left too little room for a single line. Below
            // sm the price wins the tug-of-war: it's allowed to wrap onto a
            // second line (still under the button's own height, see below)
            // instead of being cut off; sm+ has room, so it stays one line.
            <div className="text-sm font-semibold text-foreground sm:truncate">{fromLabel}</div>
          ) : null}
          {slotsLabel ? (
            <div className="truncate text-xs text-muted-foreground max-sm:hidden">{slotsLabel}</div>
          ) : null}
        </div>
        {viewer === "guest" ? (
          <Button
            asChild
            variant="primary"
            size="lg"
            // Same P9 fix: shrink the button below sm so the price above has
            // more width to wrap into — a two-line price still fits under
            // the button's own (now smaller) height, so the bar doesn't grow
            // past the 4.5rem --offer-bar-h other fixed elements rely on.
            className="shrink-0 max-sm:h-11 max-sm:px-4 max-sm:text-sm"
          >
            <Link href={loginHref()}>{ctaLabel}</Link>
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            size="lg"
            className="shrink-0 max-sm:h-11 max-sm:px-4 max-sm:text-sm"
            onClick={() => openDialog()}
          >
            {ctaLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
