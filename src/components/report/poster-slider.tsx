"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Film, Play } from "lucide-react";
import { VideoPlayer } from "./video-player";

/** Optional leading video slide (#10 / user 2026-07-25): the report hero slider
 *  shows the video FIRST when present, then the poster + gallery images. Either
 *  an embed URL (YouTube/Vimeo, already normalized to /embed form by the caller)
 *  or an uploaded file path; embed wins when both are set. */
export type VideoSource = { embed: string | null; file: string | null };

/** The frame the slides live in. Owned by this component rather than the hero
 *  since 2026-08-05: the thumbnail strip underneath has to drive the same
 *  scroller, so the frame and the strip must sit in one client component. */
const FRAME =
  "relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-muted";

export function PosterSlider({
  images,
  alt,
  prevLabel,
  nextLabel,
  video,
  ageRating,
}: {
  images: string[];
  alt: string;
  prevLabel: string;
  nextLabel: string;
  video?: VideoSource;
  /** Age pill drawn over the top-right of the frame; empty renders nothing. */
  ageRating?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const hasVideo = !!(video && (video.embed || video.file));

  // The video slide's inner media, sized to fill its slide box.
  function videoMedia() {
    return video!.embed ? (
      <iframe
        src={video!.embed}
        title={alt}
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
      />
    ) : (
      <VideoPlayer src={video!.file!} className="absolute inset-0 h-full w-full" />
    );
  }

  const totalSlides = (hasVideo ? 1 : 0) + images.length;

  // Which slide is centred, derived from scroll position rather than tracked by
  // the click handlers — the scroller is also swipeable and scroll-snapped, so
  // the position is the only source that is right in every case.
  const onScroll = useCallback(() => {
    const s = scrollerRef.current;
    if (!s || s.clientWidth === 0) return;
    setActive(Math.round(s.scrollLeft / s.clientWidth));
  }, []);

  // Snapping back to slide 0 on resize would be worse than a stale index, so
  // this only re-derives; it never scrolls.
  useEffect(() => {
    window.addEventListener("resize", onScroll);
    return () => window.removeEventListener("resize", onScroll);
  }, [onScroll]);

  const ratingPill = ageRating ? (
    <span className="absolute right-3 top-3 inline-flex items-center rounded-full bg-black/75 px-2.5 py-1 text-xs font-bold text-white shadow-sm ring-1 ring-white/20">
      {ageRating}
    </span>
  ) : null;

  // No video, no poster/gallery — the placeholder that used to live in the hero.
  if (totalSlides === 0) {
    return (
      <div className={FRAME}>
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
          <Film className="h-12 w-12 text-primary/40" />
        </div>
        {ratingPill}
      </div>
    );
  }

  // Exactly one slide — no slider chrome, and no strip: a thumbnail row that
  // navigates between one destination is decoration.
  if (totalSlides === 1) {
    return (
      <div className={FRAME}>
        {hasVideo ? (
          <div className="absolute inset-0 bg-black">{videoMedia()}</div>
        ) : (
          <Image
            src={images[0]}
            alt={alt}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 55vw, 100vw"
            priority
          />
        )}
        {ratingPill}
      </div>
    );
  }

  function scrollToSlide(index: number) {
    const s = scrollerRef.current;
    if (!s) return;
    s.scrollTo({ left: index * s.clientWidth, behavior: "smooth" });
  }

  function scrollByPage(direction: 1 | -1) {
    const s = scrollerRef.current;
    if (!s) return;
    const atEnd = s.scrollLeft + s.clientWidth >= s.scrollWidth - 1;
    const atStart = s.scrollLeft <= 1;
    // Wrap around so the slider loops instead of dead-ending on the last/first slide.
    if (direction === 1 && atEnd) {
      s.scrollTo({ left: 0, behavior: "smooth" });
    } else if (direction === -1 && atStart) {
      s.scrollTo({ left: s.scrollWidth, behavior: "smooth" });
    } else {
      s.scrollBy({ left: direction * s.clientWidth, behavior: "smooth" });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className={FRAME}>
        <div
          ref={scrollerRef}
          onScroll={onScroll}
          className="flex h-full w-full snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {hasVideo ? (
            <div className="relative h-full w-full shrink-0 snap-center bg-black">{videoMedia()}</div>
          ) : null}
          {images.map((src, idx) => (
            <div key={idx} className="relative h-full w-full shrink-0 snap-center">
              <Image
                src={src}
                alt={`${alt} ${idx + 1}`}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 55vw, 100vw"
                priority={!hasVideo && idx === 0}
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
        {ratingPill}
      </div>

      {/* Thumbnail strip (owner request 2026-08-05). The arrows only ever move
          one slide at a time, so with a dozen gallery frames the last of them
          was eleven clicks away and nothing on screen said it existed. The
          strip scrolls on its own axis when it outgrows the column. */}
      <div className="no-print flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {hasVideo ? (
          <button
            type="button"
            onClick={() => scrollToSlide(0)}
            aria-label={`${alt} — 1`}
            aria-current={active === 0}
            className={`relative aspect-video w-20 shrink-0 overflow-hidden rounded-lg border-2 bg-black transition-opacity sm:w-24 ${
              active === 0 ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
            }`}
          >
            <span className="absolute inset-0 grid place-items-center text-white">
              <Play className="h-5 w-5 fill-current" />
            </span>
          </button>
        ) : null}
        {images.map((src, idx) => {
          const slide = (hasVideo ? 1 : 0) + idx;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => scrollToSlide(slide)}
              aria-label={`${alt} ${idx + 1}`}
              aria-current={active === slide}
              className={`relative aspect-video w-20 shrink-0 overflow-hidden rounded-lg border-2 bg-muted transition-opacity sm:w-24 ${
                active === slide
                  ? "border-primary"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <Image src={src} alt="" fill sizes="96px" className="object-cover" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
