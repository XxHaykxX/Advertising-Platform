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
   that serves it, and the group name sits on the row so the two doors visibly
   lead to the same room.

   Rows, not another card grid: the four type cards are two sections up, and
   seven more cards of the same shape would read as the same block repeated at
   a different count. A list also lets each goal carry a full sentence without
   the cards going ragged, and every row is one wide tap target instead of a
   small one.

   Placed just above the closing CTA, whose heading ("Achieve your business
   goals") this list belongs to: read together they are the brief's last
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
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3 lg:gap-16">
          <Reveal>
            {/* Sticky only where there is room to scroll past it — below lg the
                heading is simply the first thing in the flow. */}
            <div className="lg:sticky lg:top-28">
              <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                {t("adGoal.title")}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">{t("adGoal.subtitle")}</p>
            </div>
          </Reveal>

          <div className="flex flex-col gap-3 lg:col-span-2">
            {AD_GOALS.map((goal, i) => {
              const Icon = AD_GOAL_ICONS[goal.code];
              return (
                <Reveal key={goal.code} delay={0.04 * i}>
                  <Link
                    href={`/ads/${AD_GROUP_SLUGS[goal.group]}`}
                    className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-4 outline-none transition-colors duration-300 ease-out hover:border-primary/60 focus-visible:border-primary sm:items-center sm:p-5"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 ease-out group-hover:bg-primary group-hover:text-white">
                      <Icon className="h-5 w-5" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-semibold text-foreground">
                        {t(`adGoal.${goal.code}`)}
                      </span>
                      <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                        {t(`adGoal.${goal.code}.sub`)}
                      </span>
                    </span>

                    {/* The shelf this goal opens. Hidden below sm, where the row
                        is already two lines tall and the group name would wrap
                        under the description as a third, unrelated-looking one —
                        the arrow still says the row goes somewhere.

                        Fixed width and right aligned, with the arrow OUTSIDE the
                        label: group names run from one word to four, and inline
                        arrows would land at a different x on every row. */}
                    <span className="hidden shrink-0 justify-end text-right text-sm font-medium text-primary sm:flex sm:w-48">
                      {t(`adGroup.${goal.group}`)}
                    </span>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-primary transition-transform duration-300 ease-out group-hover:translate-x-1 sm:mt-0" />
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </Container>
    </Section>
  );
}
