import type { AdChannelGroup } from "@/lib/ad-channels";

/* What an advertiser came to do, as opposed to what they came to buy — the
   seven goals from the homepage brief (2026-08-18). Same convention as
   AD_CHANNELS and AD_CHANNEL_ATTRS: the closed list lives in TypeScript, every
   word lives in the dictionary under the UPPERCASE token.

   Dictionary keys each goal needs in src/lib/i18n.ts:
     adGoal.<CODE>       — the goal, as the buyer would name it
     adGoal.<CODE>.sub   — one line on what it means here

   `group` is where the goal leads. There is no /goals/<slug> page and there
   should not be: channel landing pages were removed on 2026-08-14 precisely
   because a page that describes inventory instead of showing it is a detour.
   A goal is a second door into the same four shelves, phrased the way a
   marketer thinks rather than the way media is sold.

   Four of the seven ride on channels that carry no tracking of their own —
   retargeting, app installs and measurable sales all assume a pixel, a store
   attribution or an end-to-end funnel, and a billboard has none of the three.
   Their wording says what this inventory genuinely does towards the goal (warm
   the audience the digital channels then retarget, drive searches for the app,
   support a sales push) and stops there. Do not let it drift into promising
   the measurement itself — the "accountability" argument two sections up is
   what that would contradict. */
export type AdGoal = {
  /** Token: dictionary suffix and React key. */
  code: string;
  /** The group this goal opens — goals have no pages of their own. */
  group: AdChannelGroup;
};

export const AD_GOALS: readonly AdGoal[] = [
  { code: "AWARENESS", group: "OUTDOOR" },
  { code: "TRAFFIC", group: "DIGITAL" },
  { code: "LEADS", group: "DIGITAL" },
  { code: "SALES", group: "MEDIA" },
  { code: "RETARGET", group: "DIGITAL" },
  { code: "APP", group: "DIGITAL" },
  { code: "ABM", group: "SPONSORSHIP" },
];
