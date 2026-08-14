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
import { AdsView, type CatalogRow } from "./ads-view";
import { projectToRow, spaceToRow } from "./rows";

// The former /catalog and the former channel-tile overview merged here
// (2026-08-14, stage 1) — every project and ad space in the marketplace, one
// list with the seven existing facets. /catalog now just redirects here.
export const metadata: Metadata = {
  title: "Advertising — iGovazd",
  description:
    "Browse every advertising opportunity on the platform — film and TV product placement, event sponsorship, and standalone ad spaces — filter by channel, genre and product category.",
  alternates: { canonical: "/ads" },
};

export default async function AdsPage({
  searchParams,
}: {
  /** ?channel=<CODE> — kept for old "/catalog?channel=" bookmarks (see the
   *  redirect in app/catalog/page.tsx) and any other shared link. Only seeds
   *  the channel facet's initial value. */
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
    <AdsView
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
