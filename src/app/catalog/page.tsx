import { redirect } from "next/navigation";

/** /catalog merged into /ads (2026-08-14, stage 1 of the ads/catalog merge) —
 *  every project and ad space now lives in one list under /ads, alongside the
 *  nine advertising channels. Kept as a redirect rather than deleted so old
 *  links, bookmarks and shares (e.g. "/catalog?channel=BILLBOARD") keep
 *  resolving — the query string carries straight through. */
export default async function CatalogRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    for (const v of Array.isArray(value) ? value : [value]) qs.append(key, v);
  }
  const query = qs.toString();
  redirect(query ? `/ads?${query}` : "/ads");
}
