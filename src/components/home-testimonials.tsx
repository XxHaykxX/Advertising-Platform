"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, Quote, X } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { useModalDialog } from "@/lib/use-modal-dialog";
import { DEFAULT_LOCALE, useUI, type Locale } from "@/lib/i18n-client";
import type { TestimonialDTO } from "@/lib/types";

/* Clients on camera, between the channel logos and the closing CTA. Replaced
 * the case-study cards (home-cases.tsx) on 2026-08-18: two proof sections in a
 * row read as one long shelf, and a person saying it lands harder than a
 * metric tile.
 *
 * The previews really are playing — muted, looping, all three at once — rather
 * than showing a still with a Play badge over it. That is the whole effect: a
 * frozen frame reads as a picture of a video, a moving one reads as a video.
 * Sound and controls come with the modal, which needs the click anyway.
 *
 * Neighbours are positioned by percentage of the stage, not by a translated
 * track: the stage is one aspect-ratio box, so ±62% lands the same way at 375
 * and at 1440 with no measuring and no resize listener. */

/** How far a side card sits from the centre, as a share of the stage width.
    Tuned so that at 1440 the neighbours run past the edges of the screen: a
    side card that fits entirely on screen reads as a third small card, not as
    "there is more of this". */
const SIDE_OFFSET = 70;

export function HomeTestimonials({
  items,
  locale = DEFAULT_LOCALE,
}: {
  items: TestimonialDTO[];
  locale?: Locale;
}) {
  const t = useUI(locale);
  const reducedMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState<TestimonialDTO | null>(null);
  const touchStartX = useRef<number | null>(null);

  const count = items.length;
  const go = useCallback(
    (delta: number) => setActive((i) => (i + delta + count) % count),
    [count],
  );

  if (count === 0) return null;

  /** Signed distance from the active card, wrapped the short way round, so the
      last item is "one to the left" of the first rather than n-1 to the right. */
  function offset(index: number): number {
    let d = index - active;
    if (d > count / 2) d -= count;
    if (d < -count / 2) d += count;
    return d;
  }

  const current = items[active];

  return (
    <Section id="testimonials" muted>
      <Container>
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {t("testimonials.title")}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {t("testimonials.subtitle")}
            </p>
          </div>
        </Reveal>
      </Container>

      {/* Full-bleed on purpose: the side cards are meant to run off the edges
          of the screen, which is what says "there are more of these" without
          spending a row on thumbnails. */}
      <div
        className="relative mt-12 overflow-hidden"
        role="region"
        aria-roledescription="carousel"
        aria-label={t("testimonials.title")}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") go(-1);
          if (e.key === "ArrowRight") go(1);
        }}
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          const start = touchStartX.current;
          touchStartX.current = null;
          if (start === null) return;
          const dx = e.changedTouches[0].clientX - start;
          // 40px: below that a swipe is indistinguishable from a tap that
          // wandered, and stealing those would break the Play button.
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        }}
      >
        {/* The wider inset from `sm` up is the room the arrows stand in: on a
            narrow tablet a full-width stage would put them back on top of the
            video. */}
        <div className="relative mx-auto aspect-video w-[min(100%-2rem,640px)] sm:w-[min(100%-10rem,640px)]">
          {items.map((item, i) => {
            const off = offset(i);
            if (Math.abs(off) > 1) return null;
            const isActive = off === 0;
            return (
              <motion.div
                key={item.id}
                className={`absolute inset-0 overflow-hidden rounded-2xl border border-border bg-muted shadow-lg ${
                  isActive ? "" : "cursor-pointer"
                }`}
                style={{ zIndex: isActive ? 2 : 1 }}
                animate={{
                  x: `${off * SIDE_OFFSET}%`,
                  scale: isActive ? 1 : 0.82,
                  opacity: isActive ? 1 : 0.5,
                }}
                transition={reducedMotion ? { duration: 0 } : { duration: 0.35, ease: "easeOut" }}
                // A side card is a way to reach that testimonial, not decoration.
                onClick={isActive ? undefined : () => setActive(i)}
                aria-hidden={!isActive}
              >
                <Preview item={item} still={Boolean(reducedMotion)} />

                {item.company ? (
                  <span className="pointer-events-none absolute bottom-3 left-4 text-sm font-semibold uppercase tracking-wide text-white drop-shadow-md">
                    {item.company}
                  </span>
                ) : null}

                {isActive && item.video ? (
                  <button
                    type="button"
                    onClick={() => setPlaying(item)}
                    aria-label={`${t("testimonials.play")} — ${item.authorName}`}
                    className="absolute inset-0 grid place-items-center"
                  >
                    <span className="grid h-16 w-16 place-items-center rounded-full bg-white/90 text-foreground shadow-lg transition-transform duration-200 hover:scale-105">
                      <Play className="ml-0.5 h-6 w-6 fill-current" />
                    </span>
                  </button>
                ) : null}
              </motion.div>
            );
          })}
        </div>

        {count > 1 ? (
          <>
            <NavButton side="left" label={t("testimonials.prev")} onClick={() => go(-1)}>
              <ChevronLeft className="h-5 w-5" />
            </NavButton>
            <NavButton side="right" label={t("testimonials.next")} onClick={() => go(1)}>
              <ChevronRight className="h-5 w-5" />
            </NavButton>
          </>
        ) : null}
      </div>

      <Container>
        {/* Fixed minimum height: quotes differ in length, and without it every
            switch nudges the dots and the section below by a line. */}
        <div className="mx-auto mt-10 min-h-[11rem] max-w-2xl text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={reducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {current.quote ? (
                <blockquote className="text-lg leading-relaxed text-foreground md:text-xl">
                  <Quote className="mx-auto mb-4 h-6 w-6 text-primary/40" aria-hidden />
                  {current.quote}
                </blockquote>
              ) : null}

              <div className="mt-6 flex items-center justify-center gap-3">
                {current.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={current.avatar}
                    alt=""
                    className="h-11 w-11 rounded-full object-cover"
                  />
                ) : null}
                {/* Left-aligned beside an avatar, centred without one —
                    otherwise a name shorter than its job title sits visibly
                    off the axis everything else on this section is on. */}
                <div className={current.avatar ? "text-left" : "text-center"}>
                  <p className="text-sm font-semibold text-foreground">{current.authorName}</p>
                  {current.authorRole || current.company ? (
                    <p className="text-sm text-muted-foreground">
                      {[current.authorRole, current.company].filter(Boolean).join(", ")}
                    </p>
                  ) : null}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {count > 1 ? (
          <div className="mt-6 flex justify-center gap-2">
            {items.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActive(i)}
                aria-label={t("testimonials.goTo", { n: i + 1 })}
                aria-current={i === active}
                // The dot is 8px; the button around it is 44px, tapped on a phone.
                className="grid h-11 w-6 place-items-center"
              >
                <span
                  className={`h-2 rounded-full transition-all duration-200 ${
                    i === active ? "w-6 bg-primary" : "w-2 bg-border"
                  }`}
                />
              </button>
            ))}
          </div>
        ) : null}
      </Container>

      {playing ? (
        <PlayerDialog item={playing} onClose={() => setPlaying(null)} closeLabel={t("btn.close")} />
      ) : null}
    </Section>
  );
}

/** The looping preview, or the still when there is no clip (and when the
    visitor asked for less motion — a video that loops forever is exactly what
    prefers-reduced-motion is about). */
function Preview({ item, still }: { item: TestimonialDTO; still: boolean }) {
  if (item.video) {
    return (
      <video
        src={item.video}
        poster={item.image ?? undefined}
        muted
        playsInline
        // Reduced motion stops the looping, not the picture: a paused clip still
        // shows its first frame, which beats falling through to the empty
        // placeholder when staff uploaded a video but no poster.
        loop={!still}
        autoPlay={!still}
        // Three of these are on screen at once; full preload would be several
        // megabytes before a word of the page is read.
        preload="metadata"
        aria-hidden
        className="h-full w-full object-cover"
      />
    );
  }
  if (item.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={item.image} alt="" className="h-full w-full object-cover" />;
  }
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
      <Quote className="h-10 w-10 text-primary/40" />
    </div>
  );
}

function NavButton({
  side,
  label,
  onClick,
  children,
}: {
  side: "left" | "right";
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      // Hidden on phones: at 375 the stage already spans the screen, so an
      // arrow at the edge lands on top of the video it is meant to move.
      // Swiping and the dots below do the same job there.
      className={`absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-muted sm:grid ${
        side === "left" ? "left-2 md:left-6" : "right-2 md:right-6"
      }`}
    >
      {children}
    </button>
  );
}

/** Full clip with sound and controls. The click that opened this is the user
    gesture browsers want, so autoPlay is allowed here. */
function PlayerDialog({
  item,
  onClose,
  closeLabel,
}: {
  item: TestimonialDTO;
  onClose: () => void;
  closeLabel: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  // Same as the portfolio lightbox: the portal target is browser-only.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);
  useModalDialog(panelRef, mounted);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/80 p-4 backdrop-blur-sm sm:p-8"
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={item.authorName}
        onClick={(e) => e.stopPropagation()}
        // Lenis owns the wheel on public pages; without this the scroll goes
        // to the page behind the dialog.
        data-lenis-prevent
        className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-black shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-card/90 text-foreground shadow-sm transition-colors hover:bg-muted"
        >
          <X className="h-5 w-5" />
        </button>
        {item.video ? (
          <video
            src={item.video}
            poster={item.image ?? undefined}
            controls
            autoPlay
            playsInline
            className="aspect-video w-full"
          />
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
