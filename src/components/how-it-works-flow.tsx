import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Camera,
  Clapperboard,
  Handshake,
  Megaphone,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Each branch (and the deal it produces) gets its own soft accent — the
 *  brand side runs warm/amber, the creator side runs pink-violet, and the
 *  outcome at the bottom is green. Kept as a lookup so the node + its
 *  connecting arrows always agree on a color. */
type Accent = "amber" | "fuchsia" | "emerald" | "neutral";

const ACCENT: Record<Accent, { square: string; arrow: string }> = {
  amber: { square: "bg-amber-500/10 text-amber-600", arrow: "text-amber-500" },
  fuchsia: { square: "bg-fuchsia-500/10 text-fuchsia-600", arrow: "text-fuchsia-500" },
  emerald: { square: "bg-emerald-500/10 text-emerald-600", arrow: "text-emerald-500" },
  // The two hand-off arrows (Register→Creator and Project→Hub on mobile)
  // sit between branches rather than inside one, so they stay neutral.
  neutral: { square: "bg-muted text-muted-foreground", arrow: "text-muted-foreground" },
};

interface NodeData {
  icon: LucideIcon;
  title: string;
  desc: string;
  accent: Accent;
}

/** Icon + soft colored square, name, one-line description — the shape every
 *  node in the diagram shares (the hub below swaps the icon for the logo). */
function FlowNode({ icon: Icon, title, desc, accent }: NodeData) {
  const a = ACCENT[accent];
  return (
    <div className="mx-auto flex w-full max-w-[11rem] flex-col items-center text-center">
      <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl", a.square)}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="mt-3 text-sm font-semibold text-foreground">{title}</div>
      <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}

/** The node the two branches meet at — bigger than the rest, ringed for
 *  emphasis, and carrying the iGovazd wordmark (the header's own logo — see
 *  header.tsx's Wordmark — since there's no logo image file in the repo)
 *  instead of a lucide icon. */
function HubNode({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mx-auto flex w-full max-w-[12rem] flex-col items-center text-center">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary/10 ring-4 ring-primary/15">
        <span className="text-base font-bold tracking-tight text-foreground">
          <span className="text-primary">i</span>Govazd
        </span>
      </div>
      <div className="mt-3 text-sm font-bold text-foreground">{title}</div>
      <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}

/** Horizontal connector for the desktop row — a line running into an
 *  arrowhead, pointed toward the hub from whichever side it sits on. */
function ArrowH({ toward, accent }: { toward: "right" | "left"; accent: Accent }) {
  const Icon = toward === "right" ? ArrowRight : ArrowLeft;
  return (
    // The head goes at the END of the travel, i.e. on the side nearest the
    // hub: line-then-head pointing right, head-then-line pointing left.
    <div className="flex items-center justify-center gap-1 pt-6" aria-hidden>
      {toward === "right" && <span className={cn("h-0.5 w-full rounded-full bg-current opacity-25", ACCENT[accent].arrow)} />}
      <Icon className={cn("h-5 w-5 shrink-0", ACCENT[accent].arrow)} />
      {toward === "left" && <span className={cn("h-0.5 w-full rounded-full bg-current opacity-25", ACCENT[accent].arrow)} />}
    </div>
  );
}

/** Vertical connector — used both under the hub (desktop) and between every
 *  stacked node (mobile). */
function ArrowV({ accent }: { accent: Accent }) {
  return (
    <div className="flex justify-center py-2" aria-hidden>
      <ArrowDown className={cn("h-5 w-5", ACCENT[accent].arrow)} />
    </div>
  );
}

export function HowItWorksFlow({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const t = makeUI(locale);

  const brand: NodeData = { icon: Megaphone, title: t("hiw.flow.brand"), desc: t("hiw.flow.brandDesc"), accent: "amber" };
  const register: NodeData = { icon: UserPlus, title: t("hiw.flow.register"), desc: t("hiw.flow.registerDesc"), accent: "amber" };
  const creator: NodeData = { icon: Camera, title: t("hiw.flow.creator"), desc: t("hiw.flow.creatorDesc"), accent: "fuchsia" };
  const project: NodeData = { icon: Clapperboard, title: t("hiw.flow.project"), desc: t("hiw.flow.projectDesc"), accent: "fuchsia" };
  const deal: NodeData = { icon: Handshake, title: t("hiw.flow.deal"), desc: t("hiw.flow.dealDesc"), accent: "emerald" };
  const hubTitle = t("hiw.flow.hub");
  const hubDesc = t("hiw.flow.hubDesc");

  return (
    <Section>
      <Container>
        <Reveal>
          <h2 className="text-center text-2xl font-bold text-foreground">{t("hiw.flowTitle")}</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted-foreground">
            {t("hiw.flowSubtitle")}
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          {/* Desktop: five nodes in a row, both branches pointed inward at the
              hub, with a second row (same column) carrying the hub's own
              arrow down to the deal. `row-start`/`col-start` are explicit so
              the deal doesn't depend on grid auto-placement guessing right. */}
          <div className="mt-12 hidden lg:grid lg:grid-cols-[1fr_3rem_1fr_3rem_1fr_3rem_1fr_3rem_1fr]">
            <div className="row-start-1"><FlowNode {...brand} /></div>
            <div className="row-start-1"><ArrowH toward="right" accent="amber" /></div>
            <div className="row-start-1"><FlowNode {...register} /></div>
            <div className="row-start-1"><ArrowH toward="right" accent="amber" /></div>
            <div className="row-start-1"><HubNode title={hubTitle} desc={hubDesc} /></div>
            <div className="row-start-1"><ArrowH toward="left" accent="fuchsia" /></div>
            <div className="row-start-1"><FlowNode {...project} /></div>
            <div className="row-start-1"><ArrowH toward="left" accent="fuchsia" /></div>
            <div className="row-start-1"><FlowNode {...creator} /></div>

            <div className="col-start-5 row-start-2">
              <ArrowV accent="emerald" />
              <FlowNode {...deal} />
            </div>
          </div>

          {/* Mobile/tablet: horizontal converging arrows don't fit at 390px.
              The two branches stay two branches — side by side, each running
              downward — rather than being flattened into one column, which
              would read as a single chain where the brand signs up and then
              becomes a creator. They meet at the hub underneath, exactly as
              on desktop. */}
          <div className="mt-10 lg:hidden">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col">
                <FlowNode {...brand} />
                <ArrowV accent="amber" />
                <FlowNode {...register} />
                {/* mt-auto: the two branches have descriptions of different
                    lengths, so without it the arrows into the hub would sit at
                    two different heights. */}
                <div className="mt-auto">
                  <ArrowV accent="amber" />
                </div>
              </div>
              <div className="flex flex-col">
                <FlowNode {...creator} />
                <ArrowV accent="fuchsia" />
                <FlowNode {...project} />
                <div className="mt-auto">
                  <ArrowV accent="fuchsia" />
                </div>
              </div>
            </div>
            <HubNode title={hubTitle} desc={hubDesc} />
            <ArrowV accent="emerald" />
            <FlowNode {...deal} />
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
