import { redirect } from "next/navigation";
import { findAdChannelByCode } from "@/lib/ad-channels";

/* /ads used to be every listing on the platform in one filtered list — the
 * former /catalog and the channel overview merged into it (2026-08-14). It was
 * removed 2026-08-18: mixing billboards, radio slots and film placements into
 * a single feed meant a buyer after one of them waded through the other eight,
 * and the four type cards on the homepage do the choosing instead.
 *
 * The route stays as a redirect rather than a 404 — it was linked from the
 * header, the footer, every empty state in the brand cabinet, and whatever
 * bookmarks and shared links exist out there.
 */
export default async function AdsIndexPage({
  searchParams,
}: {
  /** ?channel=<CODE> — old links (including /catalog?channel=, which redirects
   *  here) named a channel, and that names exactly one page now. */
  searchParams: Promise<{ channel?: string }>;
}) {
  const { channel } = await searchParams;
  const picked = channel ? findAdChannelByCode(channel) : undefined;
  if (picked) redirect(`/ads/${picked.slug}`);
  // No channel to honour: the homepage section holding the four type cards is
  // where the choice is made now.
  redirect("/#ad-types");
}
