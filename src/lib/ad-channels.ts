/* The nine advertising channels the platform sells (director's list,
   10.08.2026 — see docs/plan-multichannel-ads.md, stage 2), grouped into the
   four types a buyer actually shops by. Single source of truth: the homepage
   cards, the /ads/<slug> template (which serves BOTH a group and a channel),
   the header's mega-menu and DARK_HERO_PATHS and generateStaticParams all read
   these arrays, so adding a tenth channel is one entry plus its dictionary
   keys.

   Same convention as FORMAT_CATEGORY_VALUES (admin/projects/form-shared.ts):
   the closed list lives in TypeScript, the wording lives in the dictionary
   under the UPPERCASE token. Every channel needs these keys in
   src/lib/i18n.ts:
     adChannel.<CODE>        — name
     adChannel.<CODE>.desc   — one line, in the channel hero
   and every group needs adGroup.<GROUP> + adGroup.<GROUP>.desc — the homepage
   card and the group hero. (The .about paragraph and .buy1-3 bullets that used
   to fill out the channel page's marketing copy were dropped 2026-08-14,
   stage 4 — the page now leads with real inventory instead.) */

/* Four groups, in the order they appear as cards on the homepage and as
   sections in the mega-menu. Was five until 2026-08-18: CONTENT held only
   product placement and SPONSORSHIP only events, and the two read as one
   purchase to a buyer, so they merged. MEDIA kept its token but lost video
   advertising to DIGITAL — an online pre-roll is bought like a banner, not
   like a TV slot, and "broadcast" that included web video was a category
   nobody could draw a line around. The token stays MEDIA while its label says
   "broadcast" on purpose: same rule as everywhere here, the token is a
   dictionary key, not copy. */
export const AD_CHANNEL_GROUPS = ["OUTDOOR", "DIGITAL", "MEDIA", "SPONSORSHIP"] as const;

export type AdChannelGroup = (typeof AD_CHANNEL_GROUPS)[number];

/** URL segment per group. Shares the /ads/<slug> namespace with the channel
 *  slugs below and must never collide with one — ad-channels.test.ts pins
 *  that, because a collision would silently shadow a channel page. */
export const AD_GROUP_SLUGS: Record<AdChannelGroup, string> = {
  OUTDOOR: "outdoor",
  DIGITAL: "digital",
  MEDIA: "broadcast",
  SPONSORSHIP: "sponsorship",
};

/** Roll-out priority from the director's table. Not shown anywhere in the UI —
 *  it orders the channels inside their group so the ones that matter come
 *  first. */
export type AdChannelPriority = "HIGH" | "MEDIUM";

/** Which table holds this channel's inventory. `PROJECT` channels are sold
 *  through the film/series rows that already exist (Placement + SponsorshipTier);
 *  `AD_SPACE` channels wait for stage 3 and show an empty state until then. */
export type AdChannelEntity = "PROJECT" | "AD_SPACE";

export type AdChannel = {
  /** UPPERCASE token — the dictionary suffix, never shown raw. */
  code: string;
  /** URL segment under /ads/. */
  slug: string;
  group: AdChannelGroup;
  priority: AdChannelPriority;
  entity: AdChannelEntity;
};

export const AD_CHANNELS: readonly AdChannel[] = [
  { code: "PLACEMENT", slug: "placement", group: "SPONSORSHIP", priority: "HIGH", entity: "PROJECT" },
  { code: "EVENTS", slug: "events", group: "SPONSORSHIP", priority: "HIGH", entity: "PROJECT" },
  { code: "VIDEO", slug: "video-ads", group: "DIGITAL", priority: "HIGH", entity: "AD_SPACE" },
  { code: "RADIO", slug: "radio", group: "MEDIA", priority: "HIGH", entity: "AD_SPACE" },
  { code: "TV", slug: "tv", group: "MEDIA", priority: "HIGH", entity: "AD_SPACE" },
  { code: "BANNER", slug: "banner-ads", group: "DIGITAL", priority: "HIGH", entity: "AD_SPACE" },
  { code: "BILLBOARD", slug: "billboard", group: "OUTDOOR", priority: "HIGH", entity: "AD_SPACE" },
  { code: "LIFTS", slug: "lifts", group: "OUTDOOR", priority: "HIGH", entity: "AD_SPACE" },
  // Bus + metro. The only MEDIUM in the director's table, hence last in its group.
  { code: "TRANSIT", slug: "transit", group: "OUTDOOR", priority: "MEDIUM", entity: "AD_SPACE" },
];

export function findAdChannel(slug: string): AdChannel | undefined {
  return AD_CHANNELS.find((c) => c.slug === slug);
}

export function findAdChannelByCode(code: string): AdChannel | undefined {
  return AD_CHANNELS.find((c) => c.code === code);
}

/** Resolve a /ads/<slug> segment to a group. Callers try findAdChannel first
 *  and fall back to this — one flat namespace serves both levels, which is why
 *  the slugs are pinned as disjoint in the test. */
export function findAdGroup(slug: string): AdChannelGroup | undefined {
  return AD_CHANNEL_GROUPS.find((g) => AD_GROUP_SLUGS[g] === slug);
}

/** The channel codes a group sells — what a group page loads its inventory
 *  from, and what its channel switcher offers. */
export function adGroupChannelCodes(group: AdChannelGroup): string[] {
  return AD_CHANNELS.filter((c) => c.group === group).map((c) => c.code);
}

/** The channels an AdSpace can belong to — the seven that are NOT sold through
 *  a project. Drives the channel picker in the ad-space form. */
export const AD_SPACE_CHANNELS: readonly AdChannel[] = AD_CHANNELS.filter(
  (c) => c.entity === "AD_SPACE",
);

/**
 * The only gate between a form field and `AdSpace.channel`.
 *
 * The column is a plain string (see the note on AdChannel) so the directory
 * stays the single source of truth, which means nothing at the database level
 * stops a typo or a hand-crafted POST from writing "BILBOARD". Every save path
 * runs its value through here — same role `normalizePlacementType` plays for
 * placements. Returns null for anything that is not a real AD_SPACE channel;
 * callers treat null as "reject this save", never as "store null".
 */
export function normalizeAdSpaceChannel(v: string | null | undefined): string | null {
  return AD_SPACE_CHANNELS.some((c) => c.code === v) ? (v as string) : null;
}

/** The overview page's layout: every group in AD_CHANNEL_GROUPS order, its
 *  channels HIGH-first (stable within a priority — the director's own order). */
export function adChannelsByGroup(): { group: AdChannelGroup; channels: AdChannel[] }[] {
  return AD_CHANNEL_GROUPS.map((group) => ({
    group,
    channels: AD_CHANNELS.filter((c) => c.group === group).sort(
      (a, b) => Number(b.priority === "HIGH") - Number(a.priority === "HIGH"),
    ),
  }));
}
