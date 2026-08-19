import Link from "next/link";
import { ArrowRight, Megaphone, Repeat, ShoppingCart, Smartphone, Target, TrendingUp, UserPlus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { AD_GOALS } from "@/lib/ad-goals";
import { AD_GROUP_SLUGS } from "@/lib/ad-channels";
import { DEFAULT_LOCALE, makeUI, type Locale } from "@/lib/i18n";

/* The advertiser's goals, from the homepage brief — a second door into the
   same four shelves, phrased the way a marketer states the task rather than
   the way media is sold. A goal has no page of its own; it links to the group
   that serves it, and the group name sits on the tile so the two doors visibly
   lead to the same room.

   Tiles, not the seven full-width rows this shipped as on 2026-08-18 (owner,
   19.08): seven stacked rows read as a wall to scroll past, and four columns
   turn the block into two rows on a desktop.

   All seven tiles are identical — owner, 19.08. The first shipped double-wide
   and filled with the brand colour, to give the eye somewhere to start; the
   owner's call is that nothing here should stand out, so the emphasis is gone.
   The cost is arithmetic: 7 tiles leave one empty cell in a 4-column row and an
   orphan in a 2-column one. Do not "fix" that by promoting a tile again.

   Deliberately denser than the four type cards two sections up (ad-types.tsx),
   which have a boxed icon chip, a paragraph and their own CTA row: seven cards
   of that same shape would read as the same block repeated at a different
   count. Here the icon is inline, the copy is one line, and there is no CTA —
   the whole tile is the target.

   Placed just above the closing CTA, whose heading ("Achieve your business
   goals") this grid belongs to: read together they are the brief's last
   section — pick the goal, then send the brief. */
const AD_GOAL_ICONS: Record<string, LucideIcon> = {
  AWARENESS: Megaphone,
  TRAFFIC: TrendingUp,
  LEADS: UserPlus,
  SALES: ShoppingCart,
  RETARGET: Repeat,
  APP: Smartphone,
  ABM: Target,
};

export function HomeGoals({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const t = makeUI(locale);

  return (
    <Section id="goals">
      <Container>
        <Reveal>
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {t("adGoal.title")}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">{t("adGoal.subtitle")}</p>
          </div>
        </Reveal>

        {/* One column on a phone, not two. Two fits the seven tiles into 1287px
            against this layout's ~1460 — and clips the copy: "նախապատրաստում",
            "առաջխաղացում" and the sponsorship group name are single Armenian
            words wider than a 160px tile, and they ran straight off the edge. */}
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {AD_GOALS.map((goal, i) => {
            const Icon = AD_GOAL_ICONS[goal.code];
            return (
              <Reveal key={goal.code} delay={0.05 * i}>
                <Link
                  href={`/ads/${AD_GROUP_SLUGS[goal.group]}`}
                  className="card-lift group flex h-full flex-col rounded-2xl border border-border bg-card p-4 outline-none focus-visible:border-primary sm:p-5"
                >
                  {/* Icon on the title's line, not stacked above it. Stacked
                      cost ~44px per tile, which on a phone — where the grid is
                      one column and every tile is a row anyway — made this
                      section taller than the seven-row list it replaced. */}
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} />
                    <span className="text-base font-semibold text-foreground">
                      {t(`adGoal.${goal.code}`)}
                    </span>
                  </span>

                  {/* flex-1 so the group caption below sits on the tile floor —
                      goal descriptions run one to three lines and the captions
                      would otherwise land at a different height in every tile. */}
                  <span className="mt-2 block flex-1 text-sm leading-relaxed text-muted-foreground">
                    {t(`adGoal.${goal.code}.sub`)}
                  </span>

                  {/* The shelf this goal opens — shown at every width now that
                      it is a caption on its own line rather than a column
                      competing with the description for the row (the old list
                      hid it below sm for exactly that reason).

                      Plain inline text with an inline arrow, NOT a flexbox row:
                      in a flex row a group name that wraps ("sponsorship and
                      product placement" does, in every language) leaves the
                      arrow parked against the tile's right edge, floating
                      beside two lines it no longer belongs to. Inline, it
                      simply follows the last word. */}
                  <span className="mt-3 block text-xs font-semibold uppercase tracking-wide text-primary">
                    {t(`adGroup.${goal.group}`)}{" "}
                    <ArrowRight className="inline h-3.5 w-3.5 align-[-2px] transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
