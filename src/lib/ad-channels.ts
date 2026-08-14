/* The nine advertising channels the platform sells (director's list,
   10.08.2026 — see docs/plan-multichannel-ads.md, stage 2). Single source of
   truth: the /ads overview, the /ads/[channel] template, the header's
   DARK_HERO_PATHS and generateStaticParams all read this array, so adding a
   tenth channel is one entry plus its dictionary keys.

   Same convention as FORMAT_CATEGORY_VALUES (admin/projects/form-shared.ts):
   the closed list lives in TypeScript, the wording lives in the dictionary
   under the UPPERCASE token. Every channel needs these keys in
   src/lib/i18n.ts:
     adChannel.<CODE>        — name
     adChannel.<CODE>.desc   — one line, on the /ads card and in the hero
   Group names live under adGroup.<GROUP>. (The .about paragraph and .buy1-3
   bullets that used to fill out the channel page's marketing copy were
   dropped 2026-08-14, stage 4 — the page now leads with real inventory
   instead.) */

export const AD_CHANNEL_GROUPS = [
  "CONTENT",
  "SPONSORSHIP",
  "MEDIA",
  "DIGITAL",
  "OUTDOOR",
] as const;

export type AdChannelGroup = (typeof AD_CHANNEL_GROUPS)[number];

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
  /** The director's table lists Placement under BOTH Content Integration and
   *  Sponsorship. It stays ONE record with `group: "CONTENT"` (a placement is
   *  first of all an integration into the content) plus this flag, rather than
   *  two records: two records would mean two /ads/placement URLs competing for
   *  the same slug, the same inventory listed twice on the overview, and two
   *  rows to keep in sync forever. The flag is enough for what the second
   *  group actually buys us — a second badge on the card, and the fact being
   *  recorded where the next reader will look. */
  alsoSponsorship?: true;
  priority: AdChannelPriority;
  entity: AdChannelEntity;
};

export const AD_CHANNELS: readonly AdChannel[] = [
  { code: "PLACEMENT", slug: "placement", group: "CONTENT", alsoSponsorship: true, priority: "HIGH", entity: "PROJECT" },
  { code: "EVENTS", slug: "events", group: "SPONSORSHIP", priority: "HIGH", entity: "PROJECT" },
  { code: "VIDEO", slug: "video-ads", group: "MEDIA", priority: "HIGH", entity: "AD_SPACE" },
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
