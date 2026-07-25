import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";
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
  // Give each node ~200px of horizontal room; the section scrolls sideways when
  // the timeline is wider than the viewport (many stages).
  const minWidth = Math.max(n * 200, 720);

  return (
    <section className="ptl-band">
      <div className="mx-auto w-full max-w-[1200px] px-6 max-sm:px-4">
        <p className="ptl-eyebrow">{t("report.milestones.title")}</p>

        <div className="ptl-scroller mt-6">
          <div className="ptl-timeline" style={{ ["--nodes" as string]: String(n), ["--progress" as string]: `${progress}%`, minWidth }}>
            <div className="ptl-rail" />
            {milestones.map((m, i) => {
              const state = activeIndex < 0 ? "upcoming" : i < activeIndex ? "done" : i === activeIndex ? "active" : "upcoming";
              return (
                <span
                  key={m.id}
                  className={`ptl-node ptl-node--${state}`}
                  style={{ gridColumn: i + 1 }}
                  aria-hidden="true"
                />
              );
            })}
            {milestones.map((m, i) => {
              const state = activeIndex < 0 ? "upcoming" : i < activeIndex ? "done" : i === activeIndex ? "active" : "upcoming";
              const place = i % 2 === 0 ? "above" : "below";
              const filled = state !== "upcoming";
              return (
                <div
                  key={m.id}
                  className={`ptl-card ptl-card--${place} ${filled ? "ptl-card--filled" : ""} ${state === "active" ? "ptl-card--active" : ""}`}
                  style={{ gridColumn: i + 1 }}
                >
                  <p className="ptl-card-name">{m.label}</p>
                  {m.date ? <p className="ptl-card-period">{formatMilestoneDate(m.date)}</p> : null}
                  {m.note ? <p className="ptl-card-note">{m.note}</p> : null}
                </div>
              );
            })}
          </div>
        </div>

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
   instead of getting cut off. */
.ptl-scroller { overflow-x: auto; padding: 1.75rem 0.25rem; }
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
@media (prefers-reduced-motion: reduce) {
  .ptl-node--active::after { animation: none; }
  .ptl-card { transition: none; }
}
`;
