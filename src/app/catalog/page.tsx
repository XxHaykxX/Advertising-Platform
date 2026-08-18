import { redirect } from "next/navigation";
import { findAdChannelByCode } from "@/lib/ad-channels";

/** /catalog merged into /ads (2026-08-14), and /ads itself became four
 *  advertising types on the homepage (2026-08-18). Kept as a redirect rather
 *  than deleted so old links, bookmarks and shares keep resolving.
 *
 *  "/catalog?channel=BILLBOARD" names one channel, and that names exactly one
 *  page now — so it lands there directly instead of being handed to /ads to
 *  redirect a second time. */
export default async function CatalogRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = params.channel;
  const code = Array.isArray(raw) ? raw[0] : raw;
  const picked = code ? findAdChannelByCode(code) : undefined;
  redirect(picked ? `/ads/${picked.slug}` : "/#ad-types");
}
