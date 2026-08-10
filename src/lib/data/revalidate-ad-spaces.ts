import "server-only";
import { revalidatePath, updateTag } from "next/cache";

/**
 * Everything that has to be dropped after an ad space is saved, approved,
 * rejected, hidden or deleted.
 *
 * `updateTag`, NOT `revalidateTag`: the second only marks the entry stale and
 * goes on serving it, so an approved space stayed invisible for up to the
 * cache's 300s (burned on 2026-07-30). The tag is "ad-spaces" — see
 * src/lib/data/ad-spaces.ts, which reads the approval flag off the cached row.
 *
 * The rendered /ads routes hold their own cache entries on top of the tagged
 * DTOs, so the channel pages and the space cards are invalidated by path too —
 * "layout" covers /ads and everything nested under it in one call. Same
 * reasoning (and the same two-step) as revalidate-storefront.ts.
 *
 * Deliberately outside the "use server" action modules: every export there is
 * a callable RPC endpoint and must be async.
 */
export function revalidateAdSpaces() {
  updateTag("ad-spaces");
  revalidatePath("/ads", "layout");
}
