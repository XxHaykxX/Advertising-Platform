import { findAdChannelByCode } from "@/lib/ad-channels";
import { attrValueTokens } from "@/lib/ad-channel-attrs";
import type { makeUI } from "@/lib/i18n";
import type { AdSpaceListDTO, ProjectListDTO } from "@/lib/types";
import type { CatalogRow } from "./ads-view";

/* Row builders shared by /ads (every listing) and /ads/[channel] (one
 * channel's listings, stage 1 of the ads/catalog merge) — a single place so
 * the two pages can't drift on how a project or ad space turns into a
 * CatalogRow. Moved out of ads/page.tsx when /ads/[channel] started
 * rendering AdsView too instead of its own teaser grid. */

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
