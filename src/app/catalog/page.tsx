import type { Metadata } from "next";
import { getProjects } from "@/lib/data/projects";
import { getAllAdSpaces } from "@/lib/data/ad-spaces";
import { getLocale } from "@/lib/data/locale";
import { getCurrency } from "@/lib/data/currency";
import { getSiteHeaderUser } from "@/lib/data/site-header-user";
import { getBrandFavoriteSet, getOwnedProjectIdSet } from "@/lib/data/favorites";
import { loadCurrentUser } from "@/lib/auth/require";
import { canBuy, canSell } from "@/lib/auth/capabilities";
import { findAdChannelByCode } from "@/lib/ad-channels";
import { makeUI } from "@/lib/i18n";
import { Footer } from "@/components/footer";
import { CatalogView, type CatalogRow } from "./catalog-view";
import type { AdSpaceListDTO, ProjectListDTO } from "@/lib/types";

export const metadata: Metadata = {
  title: "Catalog — iGovazd",
  description:
    "Browse every advertising opportunity on the platform — film and TV product placement, event sponsorship, and standalone ad spaces — filter by channel, genre and product category.",
  alternates: { canonical: "/catalog" },
};

/** A project's own channel(s) (2026-08-10, stage B) — same rule
 *  channelProjects() applies on /ads/[channel] (placementsCount>0 ->
 *  PLACEMENT, tiersCount>0 -> EVENTS), so a project carrying both shows up
 *  under either facet without being listed twice. */
function projectToRow(p: ProjectListDTO): CatalogRow {
  const channels: string[] = [];
  if (p.placementsCount > 0) channels.push("PLACEMENT");
  if (p.tiersCount > 0) channels.push("EVENTS");
  return {
    key: `project-${p.id}`,
    channels,
    title: p.title,
    // Same fields the pre-unification search used (catalog-view.tsx, 5.6).
    haystack: `${p.title} ${p.genre} ${p.countries} ${p.synopsis}`.toLowerCase(),
    kind: "PROJECT",
    project: p,
  };
}

/** null for a space whose `channel` column isn't (or no longer is) a real
 *  AD_CHANNELS code — dropped rather than linked to a page that 404s. */
function spaceToRow(s: AdSpaceListDTO, t: ReturnType<typeof makeUI>): CatalogRow | null {
  const channel = findAdChannelByCode(s.channel);
  if (!channel) return null;
  return {
    key: `space-${s.id}`,
    channels: [channel.code],
    title: s.title,
    haystack: `${s.title} ${s.location} ${s.sizeFormat} ${t(`adChannel.${channel.code}`)}`.toLowerCase(),
    kind: "AD_SPACE",
    space: s,
    channelSlug: channel.slug,
  };
}

export default async function CatalogPage({
  searchParams,
}: {
  /** ?channel=<CODE> — set by the "view all in catalog" teasers on /ads and
   *  /ads/[channel] (B5). Only seeds the channel facet's initial value. */
  searchParams: Promise<{ channel?: string }>;
}) {
  const locale = await getLocale();
  const currency = await getCurrency();
  const { channel } = await searchParams;
  const [projects, spaces, user, currentUser] = await Promise.all([
    getProjects(locale, currency),
    getAllAdSpaces(locale, currency),
    getSiteHeaderUser(),
    loadCurrentUser(),
  ]);
  const t = makeUI(locale);
  const rows: CatalogRow[] = [
    ...projects.map(projectToRow),
    ...spaces.flatMap((s) => {
      const row = spaceToRow(s, t);
      return row ? [row] : [];
    }),
  ];
  const initialChannel = channel && findAdChannelByCode(channel) ? channel : undefined;

  // Favorites (#22) are a BRAND-only private shortlist — everyone else gets
  // an empty set, which renders every heart outline/inert.
  const favorites =
    currentUser != null && canBuy(currentUser)
      ? await getBrandFavoriteSet(currentUser.id)
      : new Set<number>();
  // Nobody buys from themselves (2026-08-11) — a dual member sees their own
  // listing with no heart/apply button. Skipped entirely for anyone who
  // can't sell, same as the favorites query above.
  const ownIds =
    currentUser != null && canSell(currentUser)
      ? await getOwnedProjectIdSet(currentUser.id)
      : new Set<number>();

  return (
    <CatalogView
      rows={rows}
      locale={locale}
      currency={currency}
      user={user}
      favorites={favorites}
      ownIds={ownIds}
      signedIn={currentUser !== null}
      isBrand={canBuy(currentUser)}
      initialChannel={initialChannel}
      footer={<Footer locale={locale} currency={currency} />}
    />
  );
}
