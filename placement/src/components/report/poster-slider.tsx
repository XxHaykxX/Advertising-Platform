"use client";

import { useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Film } from "lucide-react";

export function PosterSlider({
  images,
  alt,
  prevLabel,
  nextLabel,
}: {
  images: string[];
  alt: string;
  prevLabel: string;
  nextLabel: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  // No poster/gallery at all — the placeholder that used to live in the hero.
  if (images.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
        <Film className="h-12 w-12 text-primary/40" />
      </div>
    );
  }

  // Single image: exactly the previous, non-slider look.
  if (images.length === 1) {
    return (
      <Image
        src={images[0]}
        alt={alt}
        fill
        className="object-cover"
        sizes="(min-width: 1024px) 55vw, 100vw"
        priority
      />
    );
  }

  function scrollByPage(direction: 1 | -1) {
    scrollerRef.current?.scrollBy({
      left: direction * scrollerRef.current.clientWidth,
      behavior: "smooth",
    });
  }

  return (
    <>
      <div
        ref={scrollerRef}
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((src, idx) => (
          <div key={idx} className="relative h-full w-full shrink-0 snap-center">
            <Image
              src={src}
              alt={`${alt} ${idx + 1}`}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 55vw, 100vw"
              priority={idx === 0}
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => scrollByPage(-1)}
        aria-label={prevLabel}
        className="no-print absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/70 p-2 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-background"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => scrollByPage(1)}
        aria-label={nextLabel}
        className="no-print absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/70 p-2 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-background"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </>
  );
}
