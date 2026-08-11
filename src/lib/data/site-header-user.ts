import "server-only";
import { loadCurrentUser, loadCurrentMember, type AuthedUser } from "@/lib/auth/require";
import { canSell } from "@/lib/auth/capabilities";
import { prisma } from "@/lib/prisma";
import type { SiteHeaderUser } from "@/components/header";

/** Soft-loads the session user in the shape Header needs (adds `avatar`,
 *  which AuthedUser doesn't carry). Returns null for guests — never
 *  redirects. Shared by SiteHeader and the client-view pages (catalog,
 *  portfolio) that render <Header> directly instead of <SiteHeader />.
 *
 *  `knownUser` lets a caller that already resolved the screen's owner (e.g.
 *  /account/layout.tsx via requireMember()) hand it over directly instead of
 *  re-deriving "whoever's signed in" from loadCurrentUser(), which prefers a
 *  staff session over a member one — right for public pages (an editor
 *  browsing the site sees their own name), wrong inside the member cabinet,
 *  where the page content is unambiguously the member's (IA-49: header
 *  showed the staff account while /account/profile showed the member one,
 *  when the same browser held both cookies). */
export async function getSiteHeaderUser(
  knownUser?: AuthedUser | null,
): Promise<SiteHeaderUser | null> {
  const authUser = knownUser !== undefined ? knownUser : await loadCurrentUser();
  if (!authUser) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: {
      avatar: true,
      // Both counts unconditionally. Gating them on the member's own flags
      // (`projects: authUser.isCreator`) looked like it saved work, but a
      // staff row has both sides off and Prisma rejects an all-false _count
      // select outright: "The `select` statement for type UserCountOutputType
      // needs at least one truthy value" — every admin page 500'd. Two
      // COUNTs on indexed FKs of a row we're already fetching is not the
      // thing to economise on.
      _count: {
        select: {
          projects: true,
          interests: true,
        },
      },
    },
  });

  // IA-47, re-tested on prod 11.08: with both cookies in the browser the
  // header above resolves to the staff account, and the member's own cabinet
  // links vanish from it — while the member session is still perfectly alive
  // (/account/brand answers 200 on the same cookie). QA reads the missing
  // links as "the other session was replaced". Rather than flip the staff-wins
  // rule (an editor browsing the site should keep seeing their own name), the
  // menu gets one row pointing back at the session that lost the tie.
  // loadCurrentMember() is React-cached, so this costs nothing on a page that
  // already resolved it.
  const otherMember =
    authUser.isCreator || authUser.isBrand ? null : await loadCurrentMember();
  const otherCabinetHref = otherMember
    ? canSell(otherMember)
      ? "/account"
      : "/account/brand"
    : null;

  return {
    name: authUser.name,
    email: authUser.email,
    role: authUser.role,
    avatar: dbUser?.avatar ?? null,
    isCreator: authUser.isCreator,
    isBrand: authUser.isBrand,
    projectCount: dbUser?._count.projects ?? 0,
    interestCount: dbUser?._count.interests ?? 0,
    otherCabinetHref,
  };
}
