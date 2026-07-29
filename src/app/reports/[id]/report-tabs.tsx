"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/ui/container";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";

const BASE_TABS = [
  { id: "overview", labelKey: "report.tabs.overview" },
  { id: "production", labelKey: "report.tabs.production" },
  { id: "team", labelKey: "report.tabs.cast" },
  { id: "offer", labelKey: "report.tabs.offer" },
] as const;

export function ReportTabs({
  hasProduction = true,
  hasCast = true,
  hasOffer = true,
  locale = DEFAULT_LOCALE,
}: {
  hasProduction?: boolean;
  hasCast?: boolean;
  hasOffer?: boolean;
  locale?: Locale;
}) {
  const t = makeUI(locale);
  // "overview" always exists; the other three only show up when the page
  // actually renders that section (audit A2 — the commercial tab used to be
  // ~3500px of scroll away with no tab of its own).
  const TABS = BASE_TABS.filter((tab) => {
    if (tab.id === "production") return hasProduction;
    if (tab.id === "team") return hasCast;
    if (tab.id === "offer") return hasOffer;
    return true;
  });
  const [active, setActive] = useState<string>("overview");
  // Section set changes with the project (no cast, no production timeline...).
  // Keying the effect on the id list itself — rather than leaving deps empty —
  // means the observer re-subscribes when that set changes instead of going
  // stale and watching sections that no longer match the rendered tabs.
  const idsKey = TABS.map((tab) => tab.id).join(",");

  const navRef = useRef<HTMLElement>(null);
  const tabRefs = useRef(new Map<string, HTMLAnchorElement>());
  // P4: the strip's own scrollbar is hidden on purpose (see the comment on
  // <nav> below), so this fade is the only hint that there's more to the
  // right — lit only while there actually is, dark once the strip fits the
  // viewport or has already been scrolled all the way.
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    function update() {
      if (!nav) return;
      const { scrollLeft, scrollWidth, clientWidth } = nav;
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
    update();
    nav.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      nav.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [idsKey]);

  // Keep the active tab inside the visible strip as the reader scrolls the
  // page — on a 390px screen "Առաջարկ բրենդներին" (the tab a brand actually
  // came for) could otherwise become active while sitting entirely off-strip.
  // Not scrollIntoView: on this page that would scroll the whole document,
  // since the nearest scrollable ancestor isn't the strip itself — only the
  // strip's own scrollLeft should move (same reasoning as timeline-scroller).
  useEffect(() => {
    const nav = navRef.current;
    const tab = tabRefs.current.get(active);
    if (!nav || !tab) return;
    const navBox = nav.getBoundingClientRect();
    const tabBox = tab.getBoundingClientRect();
    const overflowLeft = navBox.left - tabBox.left;
    const overflowRight = tabBox.right - navBox.right;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior = reduced ? "auto" : "smooth";
    if (overflowLeft > 0) {
      nav.scrollBy({ left: -overflowLeft, behavior });
    } else if (overflowRight > 0) {
      nav.scrollBy({ left: overflowRight, behavior });
    }
  }, [active]);

  useEffect(() => {
    const sections = idsKey
      .split(",")
      .filter(Boolean)
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 },
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [idsKey]);

  return (
    // no-print: a media-kit PDF has no use for an in-page tab strip, and a
    // sticky element left in would print itself on every page (P7a).
    <div className="no-print sticky top-16 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <Container>
        <div className="relative">
          {/* Bleed to the container's own edge and re-add its padding so the
              scrollable strip has the same trailing space as the page, instead
              of clipping the last (and most important, "offer") tab against it. */}
          {/* The scrollbar itself is hidden: on a 390px screen the four tabs
              overflow, and a native horizontal bar under them reads as a broken
              divider rather than an affordance — the fade below is the
              affordance, and the effect above keeps the active one in view. */}
          <nav
            ref={navRef}
            className="-mx-4 flex gap-1 overflow-x-auto px-4 py-2 [scrollbar-width:none] sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden"
          >
            {TABS.map((tab) => {
              const isActive = active === tab.id;
              const isOffer = tab.id === "offer";
              return (
                <a
                  key={tab.id}
                  ref={(el) => {
                    if (el) tabRefs.current.set(tab.id, el);
                    else tabRefs.current.delete(tab.id);
                  }}
                  href={`#${tab.id}`}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    // The transparent border is what keeps the plain tabs the
                    // same height as the outlined offer tab — without it the
                    // text in every other tab sits a pixel higher.
                    // Tighter padding and smaller text below sm: on a 390px
                    // screen four full-size tabs pushed "Առաջարկ բրենդներին"
                    // (the tab a brand came for) mostly off the right edge.
                    "shrink-0 rounded-lg border border-transparent px-2 py-2 text-xs font-medium transition-colors sm:px-4 sm:text-sm",
                    isOffer
                      ? // The offer is the tab a brand actually comes here for — it
                        // stays visibly marked even when it isn't the active one,
                        // just not as loud as the active state.
                        isActive
                        ? "border border-primary bg-primary text-primary-foreground"
                        : "border border-primary/40 bg-primary/5 text-primary hover:bg-primary/10"
                      : isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t(tab.labelKey)}
                </a>
              );
            })}
          </nav>
          {/* Right-edge fade: only lit while the strip actually has more tabs
              hidden past its right edge (see the scroll-tracking effect above). */}
          <div
            aria-hidden
            className={cn(
              "no-print pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent transition-opacity",
              canScrollRight ? "opacity-100" : "opacity-0",
            )}
          />
        </div>
      </Container>
    </div>
  );
}
