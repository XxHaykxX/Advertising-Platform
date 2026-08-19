"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DEFAULT_LOCALE, useLocalizer, type Locale } from "@/lib/i18n-client";
import { cn } from "@/lib/utils";
import { useDragScroll } from "@/lib/use-drag-scroll";
import { mediaUrl } from "@/lib/media-url";
import type { ActorDTO } from "@/lib/types";

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function ActorCard({ actor, locale }: { actor: ActorDTO; locale: Locale }) {
  // A single hook call up front — actor.roles is variable-length, so calling
  // the (context-reading) localizeValue() once per role inside .map() below
  // would violate the Rules of Hooks the moment two actors have a different
  // number of roles.
  const localize = useLocalizer(locale);
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
      {actor.photo ? (
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-border">
          {/* `unoptimized` dropped 2026-07-31: headshots are stored at 800×800,
              and this circle is 48px. Letting the optimizer honour `sizes` is
              the whole point of having it back on. */}
          <Image src={mediaUrl(actor.photo)} alt={actor.name} fill className="object-cover" sizes="48px" />
        </div>
      ) : (
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ background: "var(--grad)" }}
          aria-hidden
        >
          {initials(actor.name)}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate font-semibold text-foreground">{actor.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {(actor.roles.length ? actor.roles : actor.role ? [actor.role] : [])
            .map((r) => localize("role", r))
            .join(" · ")}
        </p>
      </div>
    </div>
  );
}

export function CastCarousel({
  actors,
  prevLabel,
  nextLabel,
  locale = DEFAULT_LOCALE,
}: {
  actors: ActorDTO[];
  prevLabel: string;
  nextLabel: string;
  locale?: Locale;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  useDragScroll(scrollerRef);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Track scroll position so the edge arrows can disable themselves — nothing
  // to scroll to past the first/last card. Runs unconditionally (before the
  // 4-or-fewer early return below) because hooks can't be called conditionally;
  // the effect just no-ops when there's no scroller to observe.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    function update() {
      if (!el) return;
      const { scrollLeft, scrollWidth, clientWidth } = el;
      // 1px tolerance for the fractional scroll positions browsers report.
      setCanScrollLeft(scrollLeft > 1);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [actors.length]);

  // 4 or fewer actors: a plain 4-up row, nothing to scroll so no arrows.
  if (actors.length <= 4) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {actors.map((actor) => (
          <ActorCard key={actor.id} actor={actor} locale={locale} />
        ))}
      </div>
    );
  }

  function scrollByPage(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    const cardWidth = card ? card.getBoundingClientRect().width + gap : 0;
    // Scroll one card short of a full page so the last (peeking) card becomes
    // the first one on the next page — keeps a card of visual context instead
    // of jumping straight past the peek.
    const step = Math.max(el.clientWidth - cardWidth, el.clientWidth / 2);
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        // cursor-grab + useDragScroll: the arrows were the only way to move
        // this with a mouse; a swipe with the cursor is the gesture people
        // reach for first, and the hand is what advertises it.
        className="flex cursor-grab snap-x snap-proximity gap-3 overflow-x-auto scroll-smooth [scrollbar-width:none] [&.is-dragging]:cursor-grabbing [&.is-dragging]:select-none [&::-webkit-scrollbar]:hidden"
      >
        {actors.map((actor) => (
          <div
            key={actor.id}
            // Peek math: basis divisor = (full cards visible) + (peek fraction),
            // e.g. lg's 3.35 shows 3 full cards plus ~a third of the 4th — reads
            // as "there's more" instead of clipping a card in half. Same 0.35
            // peek fraction at every breakpoint for a consistent feel.
            className="shrink-0 snap-start basis-[calc((100%-0.75rem)/1.35)] sm:basis-[calc((100%-2*0.75rem)/2.35)] lg:basis-[calc((100%-3*0.75rem)/3.35)]"
          >
            <ActorCard actor={actor} locale={locale} />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => scrollByPage(-1)}
        disabled={!canScrollLeft}
        aria-label={prevLabel}
        aria-disabled={!canScrollLeft}
        className={cn(
          "no-print absolute left-0 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-background p-2 text-foreground shadow-sm transition-colors hover:bg-muted max-sm:hidden",
          !canScrollLeft && "pointer-events-none opacity-40",
        )}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => scrollByPage(1)}
        disabled={!canScrollRight}
        aria-label={nextLabel}
        aria-disabled={!canScrollRight}
        className={cn(
          // translate-x-1/2, not -translate-x-1/2: mirrored from the left
          // arrow so this one also straddles the container edge. It used to be
          // pushed inward instead, parking it on top of the last card.
          "no-print absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-1/2 rounded-full border border-border bg-background p-2 text-foreground shadow-sm transition-colors hover:bg-muted max-sm:hidden",
          !canScrollRight && "pointer-events-none opacity-40",
        )}
      >
        <ChevronRight className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
