import { findAdChannelByCode } from "@/lib/ad-channels";
import { attrValueTokens } from "@/lib/ad-channel-attrs";
import { getAllAdSpaces } from "@/lib/data/ad-spaces";
import { getProjects } from "@/lib/data/projects";
import type { makeUI } from "@/lib/i18n";
import type { CurrencyCode } from "@/lib/currency";
import type { Locale } from "@/lib/i18n-base";
import type { AdSpaceListDTO, ProjectListDTO } from "@/lib/types";
import type { CatalogRow } from "./ads-view";

/* How /ads/<slug> turns inventory into rows — one place so the group page and
 * the channel page can't drift on what a project or ad space looks like in a
 * list. Moved out of ads/page.tsx when /ads/[channel] started rendering
 * AdsView instead of its own teaser grid, and kept when the everything-at-once
 * /ads list was removed (2026-08-18). */

/** A project's own channel(s) (2026-08-10, stage B) — same rule
 *  channelProjects() applies on /ads/[channel] (placementsCount>0 ->
 *  PLACEMENT, tiersCount>0 -> EVENTS), so a project carrying both shows up
 *  under either facet without being listed twice. */
export function projectToRow(p: ProjectListDTO): CatalogRow {
  const channels: string[] = [];
  if (p.placementsCount > 0) channels.push("PLACEMENT");
  if (p.tiersCount > 0) channels.push("EVENTS");
  return {
    key: `project-${p.id}`,
    channels,
    title: p.title,
    // Same fields the pre-unification search used (catalog-view.tsx, 5.6),
    // plus the PLACEMENT/EVENTS attribute values (stage 3) — raw tokens, not
    // localized, same "search matches the canonical value" rule attrTokens'
    // own doc comment states.
    haystack: `${p.title} ${p.genre} ${p.countries} ${p.synopsis} ${attrValueTokens(p.attrs).join(" ")}`.toLowerCase(),
    kind: "PROJECT",
    project: p,
  };
}

/** null for a space whose `channel` column isn't (or no longer is) a real
 *  AD_CHANNELS code — dropped rather than linked to a page that 404s. */
export function spaceToRow(s: AdSpaceListDTO, t: ReturnType<typeof makeUI>): CatalogRow | null {
  const channel = findAdChannelByCode(s.channel);
  if (!channel) return null;
  return {
    key: `space-${s.id}`,
    channels: [channel.code],
    title: s.title,
    haystack: `${s.title} ${s.location} ${s.sizeFormat} ${t(`adChannel.${channel.code}`)} ${attrValueTokens(s.attrs).join(" ")}`.toLowerCase(),
    kind: "AD_SPACE",
    space: s,
    channelSlug: channel.slug,
  };
}

/** Which projects count as a PROJECT channel's inventory. Placement sells
 *  `Placement` rows, event sponsorship sells `SponsorshipTier` rows — the two
 *  counters the list DTO already carries, so no new query and no new data
 *  layer. A project carrying both is inventory for both, and appears once
 *  either way because the rows are keyed by project id. */
function projectsForChannels(codes: readonly string[], projects: ProjectListDTO[]): ProjectListDTO[] {
  const wantsPlacement = codes.includes("PLACEMENT");
  const wantsEvents = codes.includes("EVENTS");
  return projects.filter(
    (p) => (wantsPlacement && p.placementsCount > 0) || (wantsEvents && p.tiersCount > 0),
  );
}

/**
 * Every listing belonging to the given channels, as catalog rows.
 *
 * One code = a channel page, several = a group page. Each entity kind queries
 * only its own table, and only when the set of channels actually contains one:
 * an outdoor group never touches Project, a sponsorship group never touches
 * AdSpace.
 *
 * Ad spaces come from the single `ad-spaces-all` cache entry rather than one
 * per-channel query each — a group page would otherwise fire three, and the
 * whole approved set is one small list the other pages have warm anyway.
 */
export async function loadCatalogRows(
  codes: readonly string[],
  locale: Locale,
  currency: CurrencyCode,
  t: ReturnType<typeof makeUI>,
): Promise<CatalogRow[]> {
  const wanted = new Set(codes);
  const needsProjects = wanted.has("PLACEMENT") || wanted.has("EVENTS");
  const needsSpaces = codes.some((c) => c !== "PLACEMENT" && c !== "EVENTS");

  const [projects, spaces] = await Promise.all([
    needsProjects ? getProjects(locale, currency) : Promise.resolve([]),
    needsSpaces ? getAllAdSpaces(locale, currency) : Promise.resolve([]),
  ]);

  return [
    ...projectsForChannels(codes, projects).map(projectToRow),
    ...spaces.flatMap((s) => {
      if (!wanted.has(s.channel)) return [];
      const row = spaceToRow(s, t);
      return row ? [row] : [];
    }),
  ];
}
