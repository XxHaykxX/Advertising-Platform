import "server-only";
import { loadCurrentUser, type AuthedUser } from "@/lib/auth/require";
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

  return {
    name: authUser.name,
    email: authUser.email,
    role: authUser.role,
    avatar: dbUser?.avatar ?? null,
    isCreator: authUser.isCreator,
    isBrand: authUser.isBrand,
    projectCount: dbUser?._count.projects ?? 0,
    interestCount: dbUser?._count.interests ?? 0,
  };
}
