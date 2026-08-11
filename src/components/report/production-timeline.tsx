import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";
import { TimelineScroller, type TimelineDot } from "@/components/report/timeline-scroller";
import type { ProjectDetailDTO } from "@/lib/types";

/** ISO date -> "DD.MM.YYYY" (locale-neutral) for the milestone card. */
function formatMilestoneDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getUTCDate())}.${p(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}`;
}

// Per-project production timeline (Ф4/#27) — a horizontal, Kinodaran-style
// timeline of production stages, edited inline in the admin project form
// (MilestonesSection) and rendered here. Labels are free-text Armenian; exactly
// one milestone carries isActive (the current stage), so nodes before it read
// as done, after it as upcoming. Styled with the site's own theme tokens
// (light section band, indigo --primary accent) so it matches the rest of the
// report page — no dark band (user request 2026-07-25).
export function ProductionTimeline({
  project,
  locale = DEFAULT_LOCALE,
}: {
  project: ProjectDetailDTO;
  locale?: Locale;
}) {
  const milestones = project.milestones;
  if (milestones.length === 0) return null;
  const t = makeUI(locale);

  const activeIndex = milestones.findIndex((m) => m.isActive);
  const n = milestones.length;
  // Progress rail fills to the CENTER of the active node (activeIndex/(n-1)).
  const progress =
    activeIndex < 0 ? 0 : n === 1 ? (activeIndex === 0 ? 100 : 0) : (activeIndex / (n - 1)) * 100;
  // Give each node 240px of horizontal room. It used to be 200px, which is
  // less than the 220px a card can take — so on a ten-stage project neighbours
  // all but touched and the outer cards were clipped by the scroller (audit
  // B1). 240 leaves a 20px gutter between cards.
  const minWidth = Math.max(n * 240, 720);

  const stageState = (i: number): TimelineDot["state"] =>
    activeIndex < 0 ? "upcoming" : i < activeIndex ? "done" : i === activeIndex ? "active" : "upcoming";
  const dots: TimelineDot[] = milestones.map((m, i) => ({
    id: m.id,
    label: m.label,
    state: stageState(i),
  }));

  return (
    <section className="ptl-band">
      <div className="mx-auto w-full max-w-[1200px] px-6 max-sm:px-4">
        {/* h2, not p: this was the one section on the page with no heading in
            the document outline — invisible to a screen reader's landmarks
            list and to anything that builds a table of contents, even though
            the "Production" tab points straight at it (audit P8). */}
        <h2 className="ptl-eyebrow">{t("report.milestones.title")}</h2>

        <TimelineScroller dots={dots}>
          <div className="ptl-timeline" style={{ ["--nodes" as string]: String(n), ["--progress" as string]: `${progress}%`, minWidth }}>
            <div className="ptl-rail" />
            {milestones.map((m, i) => {
              const state = stageState(i);
              return (
                <span
                  key={m.id}
                  className={`ptl-node ptl-node--${state}`}
                  // --i is the stage's index, read only by the phone layout
                  // (PTL_CSS), where a node and its card share grid row i+1
                  // instead of sitting in the same column.
                  style={{ gridColumn: i + 1, ["--i" as string]: String(i) }}
                  // Read by TimelineScroller to centre the current stage on
                  // load and to work out which dot is lit.
                  data-node-index={i}
                  aria-hidden="true"
                />
              );
            })}
            {milestones.map((m, i) => {
              const state = stageState(i);
              const place = i % 2 === 0 ? "above" : "below";
              const filled = state !== "upcoming";
              return (
                <div
                  key={m.id}
                  className={`ptl-card ptl-card--${place} ${filled ? "ptl-card--filled" : ""} ${state === "active" ? "ptl-card--active" : ""}`}
                  style={{ gridColumn: i + 1, ["--i" as string]: String(i) }}
                >
                  <p className="ptl-card-name">{m.label}</p>
                  {m.date ? <p className="ptl-card-period">{formatMilestoneDate(m.date)}</p> : null}
                  {m.note ? <p className="ptl-card-note">{m.note}</p> : null}
                </div>
              );
            })}
          </div>
        </TimelineScroller>

        <div className="ptl-legend mt-6">
          <span><i className="ptl-dot ptl-dot--done" /> {t("report.milestones.done")}</span>
          <span><i className="ptl-dot ptl-dot--active" /> {t("report.milestones.currentStage")}</span>
          <span><i className="ptl-dot ptl-dot--upcoming" /> {t("report.milestones.upcoming")}</span>
        </div>
      </div>

      <style>{PTL_CSS}</style>
    </section>
  );
}

// Scoped styles (every class prefixed `ptl-`), built on the site's theme tokens
// so the section matches the page (light --section band, indigo --primary).
// A soft glow uses a fixed rgba of --primary (#4f46e5). The scroller keeps
// generous vertical padding so a card's hover-lift is never clipped by the
// horizontal-scroll overflow.
const PTL_CSS = `
.ptl-band {
  background: var(--section);
  padding: 3rem 0;
}
@media (max-width: 640px) { .ptl-band { padding: 2.5rem 0; } }
.ptl-eyebrow {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--foreground);
}
/* Horizontal scroll for wide timelines. overflow-x:auto also clips vertical
   overflow, so the top/bottom padding gives the hover-lift + card shadow room
   instead of getting cut off. The inline padding is what keeps the first and
   last card off the scroller's edges — at 0.25rem they were being shaved
   (audit B1) — and scroll-padding keeps a snapped stage clear of the fades. */
.ptl-scrollwrap { position: relative; margin-top: 1.5rem; }
.ptl-scroller {
  overflow-x: auto;
  padding: 1.75rem 1.5rem;
  scroll-padding-inline: 1.5rem;
  /* The native bar sits under the rail and reads as a stray line; the edge
     fades and the dots are the affordance instead. */
  scrollbar-width: none;
  /* The rail is draggable with a mouse (useDragScroll) — the hand is what
     says so, since there is no scrollbar left to hint at it. */
  cursor: grab;
}
.ptl-scroller.is-dragging {
  cursor: grabbing;
  /* Text picked up mid-drag would fight the drag and leave a blue smear. */
  user-select: none;
}
.ptl-scroller::-webkit-scrollbar { display: none; }

/* Lit only while there is more timeline in that direction — a fade at an edge
   with nothing behind it would be a lie about where the content is. */
.ptl-fade {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 3rem;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease;
}
.ptl-fade.is-on { opacity: 1; }
.ptl-fade--left {
  left: 0;
  background: linear-gradient(90deg, var(--section), color-mix(in srgb, var(--section) 0%, transparent));
}
.ptl-fade--right {
  right: 0;
  background: linear-gradient(270deg, var(--section), color-mix(in srgb, var(--section) 0%, transparent));
}

/* Phone only: one stage fills the rail there, so the dots are what say how
   many stages exist and which one you are on. */
.ptl-dots { display: none; }
@media (max-width: 767px) {
  .ptl-scroller { scroll-snap-type: x mandatory; }
  .ptl-node { scroll-snap-align: center; }
  .ptl-dots {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    /* 1rem, not the 0.5rem this started at: the gap is what the tap targets
       below are made of. At 0.5rem the pitch is 17px and any usable target
       overlaps its neighbours, so a tap near the edge activates the wrong
       stage — worse than a small target. At 1rem the pitch is 25px and the
       targets sit edge to edge with no overlap; ten dots still come to 234px,
       inside a 390px screen. */
    gap: 1rem;
    margin-top: 0.75rem;
  }
  .ptl-dot-btn {
    position: relative; /* anchors the ::after tap-target below */
    width: 9px;
    height: 9px;
    padding: 0;
    border-radius: 50%;
    border: 1.5px solid var(--border);
    background: var(--card);
    cursor: pointer;
    transition: transform 0.2s, background 0.2s, border-color 0.2s;
  }
  /* The visible dot stays 9px (its look is not the problem), but a 9px button
     is far under the touch target a thumb needs. ::after grows the hit area
     to 25px — the full 44px would be three times the 25px pitch and every
     dot would swallow both its neighbours, which is worse than a small
     target: the tap would land on the wrong stage. */
  .ptl-dot-btn::after {
    content: "";
    position: absolute;
    inset: -8px;
  }
  .ptl-dot-btn--done { background: color-mix(in srgb, var(--primary) 45%, transparent); border-color: transparent; }
  .ptl-dot-btn--active { background: var(--primary); border-color: transparent; }
  .ptl-dot-btn.is-current { transform: scale(1.5); border-color: var(--primary); }
  /* transform: scale() on the button scales its ::after right along with it,
     so without this the current dot's tap zone would balloon to 37px and eat
     into its neighbours'. Scaling the pseudo-element back down by the inverse
     factor (1/1.5) cancels that out, holding it at the same 25px every other
     dot gets. */
  .ptl-dot-btn.is-current::after { transform: scale(0.6667); }
}
.ptl-timeline {
  display: grid;
  grid-template-columns: repeat(var(--nodes), 1fr);
  grid-template-rows: 1fr auto 1fr;
  align-items: center;
  position: relative;
}
.ptl-rail {
  grid-row: 2;
  grid-column: 1 / -1;
  height: 6px;
  border-radius: 6px;
  background: var(--border);
  position: relative;
  z-index: 1;
}
.ptl-rail::before {
  content: "";
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: var(--progress, 0%);
  background: linear-gradient(90deg, var(--primary), color-mix(in srgb, var(--primary) 70%, #fff));
  border-radius: 6px;
  box-shadow: 0 0 16px rgba(79,70,229,0.35);
}
.ptl-node {
  grid-row: 2;
  justify-self: center;
  z-index: 3;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--card);
  border: 3px solid var(--border);
  box-shadow: 0 1px 4px rgba(17,24,39,0.12);
  position: relative;
}
.ptl-node--done { background: var(--primary); border-color: var(--primary); }
.ptl-node--active {
  background: var(--primary);
  border-color: #fff;
  width: 36px;
  height: 36px;
  box-shadow: 0 0 0 5px rgba(79,70,229,0.16), 0 0 22px 3px rgba(79,70,229,0.4);
}
.ptl-node--active::after {
  content: "";
  position: absolute;
  inset: -5px;
  border-radius: 50%;
  border: 2px solid var(--primary);
  animation: ptl-pulse 2.2s ease-out infinite;
}
@keyframes ptl-pulse {
  0% { transform: scale(1); opacity: 0.7; }
  70% { transform: scale(1.85); opacity: 0; }
  100% { opacity: 0; }
}
.ptl-card {
  justify-self: center;
  max-width: 220px;
  text-align: center;
  background: var(--card);
  border: 1.5px solid var(--border);
  border-radius: 16px;
  padding: 0.75rem 1.1rem;
  position: relative;
  box-shadow: 0 1px 3px rgba(17,24,39,0.06);
  transition: border-color 0.25s, box-shadow 0.25s, transform 0.25s;
}
.ptl-card:hover {
  border-color: var(--primary);
  box-shadow: 0 10px 28px rgba(17,24,39,0.12), 0 0 0 1px var(--primary);
  transform: translateY(-4px);
}
.ptl-card--above { grid-row: 1; margin-bottom: 1.3rem; }
.ptl-card--below { grid-row: 3; margin-top: 1.3rem; }
.ptl-card::after {
  content: "";
  position: absolute;
  left: 50%;
  width: 2px;
  height: 1rem;
  background: var(--border);
}
.ptl-card--above::after { bottom: -1.05rem; }
.ptl-card--below::after { top: -1.05rem; }
.ptl-card--active { border-color: var(--primary); box-shadow: 0 6px 20px rgba(79,70,229,0.18); }
.ptl-card-name {
  margin: 0 0 0.15rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--muted-foreground);
}
.ptl-card--filled .ptl-card-name { color: var(--primary); }
.ptl-card-period {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--foreground);
  letter-spacing: -0.01em;
}
.ptl-card-note {
  margin: 0.2rem 0 0;
  font-size: 0.8rem;
  font-weight: 400;
  color: var(--muted-foreground);
}
.ptl-legend {
  display: flex;
  gap: 1.4rem;
  flex-wrap: wrap;
  font-size: 0.82rem;
  color: var(--muted-foreground);
}
.ptl-legend span { display: inline-flex; align-items: center; gap: 0.45rem; }
.ptl-dot { width: 13px; height: 13px; border-radius: 50%; display: inline-block; }
.ptl-dot--done { background: var(--primary); }
.ptl-dot--active { background: var(--primary); box-shadow: 0 0 8px rgba(79,70,229,0.5); }
.ptl-dot--upcoming { background: var(--card); border: 2px solid var(--border); }
/* ── Phones: the timeline stands up ───────────────────────────────────────
   Ten stages at 240px each is a 2400px rail. On a 375px screen that meant
   dragging sideways through six and a half screens to read a list — the
   research behind audit B1 said the same thing: below ~768px a horizontal
   timeline becomes a vertical one, and only the desktop layout keeps the
   left-to-right rail. Node i and card i share a grid row, so the pairing
   survives the flip; the inline grid-column/min-width the component sets for
   the desktop grid is overridden here, which is what the !important is for. */
@media (max-width: 640px) {
  .ptl-scroller {
    overflow-x: visible;
    padding: 0.5rem 0.25rem;
    cursor: default;
  }
  /* Nothing scrolls sideways any more, so the affordances for that would be
     pointing at something that cannot happen. */
  .ptl-fade, .ptl-dots { display: none; }
  .ptl-timeline {
    grid-template-columns: 36px minmax(0, 1fr);
    grid-template-rows: none;
    grid-auto-rows: auto;
    row-gap: 1.1rem;
    column-gap: 0.9rem;
    align-items: start;
    min-width: 0 !important;
  }
  .ptl-rail {
    grid-column: 1 !important;
    /* Not 1 / -1: -1 is the last EXPLICIT line, and every row here is
       implicit (grid-auto-rows), so it resolved to a single row and the rail
       came out 94px long. --nodes is the stage count the component already
       sets on .ptl-timeline. */
    grid-row: 1 / calc(var(--nodes) + 1);
    justify-self: center;
    /* align-self, not height:100%: the grid sets align-items:start for the
       cards, which leaves the rail an auto-height box — it drew a stub a dot
       and a half long instead of running the length of the stage list. */
    align-self: stretch;
    width: 6px;
    height: auto;
  }
  .ptl-rail::before {
    width: 100%;
    height: var(--progress, 0%);
    background: linear-gradient(180deg, var(--primary), color-mix(in srgb, var(--primary) 70%, #fff));
  }
  .ptl-node {
    grid-column: 1 !important;
    grid-row: calc(var(--i) + 1);
    /* Nudged down to sit level with the card's first line rather than with the
       top of its border. */
    margin-top: 0.6rem;
  }
  .ptl-card {
    grid-column: 2 !important;
    grid-row: calc(var(--i) + 1) !important;
    justify-self: stretch;
    max-width: none;
    text-align: start;
  }
  /* Both variants are simply "the card to the right of its dot" here — the
     above/below zig-zag and its little connector stem are a horizontal idea. */
  .ptl-card--above { margin-bottom: 0; }
  .ptl-card--below { margin-top: 0; }
  .ptl-card::after { display: none; }
  .ptl-card:hover { transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  .ptl-node--active::after { animation: none; }
  .ptl-card { transition: none; }
  .ptl-fade { transition: none; }
  .ptl-dot-btn { transition: none; }
}
/* The dots live in TimelineScroller, a child component we don't own, so
   there's no className to hang the project's usual no-print class on —
   this reaches the same result from here instead. On paper they're just
   dead circles with no click to give, and the edge fades are a hint to keep
   scrolling that means nothing on a fixed page, so both go (audit P7b). */
@media print {
  .ptl-dots { display: none !important; }
  .ptl-fade { display: none !important; }
}
`;
