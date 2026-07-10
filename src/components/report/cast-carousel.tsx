"use client";

import { useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ActorDTO } from "@/lib/types";

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function ActorCard({ actor }: { actor: ActorDTO }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
      {actor.photo ? (
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-border">
          <Image src={actor.photo} alt={actor.name} fill className="object-cover" sizes="48px" unoptimized />
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
        <p className="truncate text-xs text-muted-foreground">{actor.role}</p>
      </div>
    </div>
  );
}

export function CastCarousel({
  actors,
  prevLabel,
  nextLabel,
}: {
  actors: ActorDTO[];
  prevLabel: string;
  nextLabel: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  // 4 or fewer actors: a plain 4-up row, nothing to scroll so no arrows.
  if (actors.length <= 4) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {actors.map((actor) => (
          <ActorCard key={actor.id} actor={actor} />
        ))}
      </div>
    );
  }

  function scrollByPage(direction: 1 | -1) {
    scrollerRef.current?.scrollBy({
      left: direction * scrollerRef.current.clientWidth,
      behavior: "smooth",
    });
  }

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {actors.map((actor) => (
          <div
            key={actor.id}
            className="shrink-0 snap-start basis-[85%] sm:basis-[calc((100%-0.75rem)/2)] lg:basis-[calc((100%-3*0.75rem)/4)]"
          >
            <ActorCard actor={actor} />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => scrollByPage(-1)}
        aria-label={prevLabel}
        className="no-print absolute left-0 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-background p-2 text-foreground shadow-sm transition-colors hover:bg-muted"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => scrollByPage(1)}
        aria-label={nextLabel}
        className="no-print absolute right-0 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-background p-2 text-foreground shadow-sm transition-colors hover:bg-muted"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
