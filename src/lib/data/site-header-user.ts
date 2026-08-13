import "server-only";
import { loadCurrentMember, type AuthedUser } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import type { SiteHeaderUser } from "@/components/header";

/** Soft-loads the session user in the shape Header needs (adds `avatar`,
 *  which AuthedUser doesn't carry). Returns null for guests — never
 *  redirects. Shared by SiteHeader and the client-view pages (catalog,
 *  portfolio) that render <Header> directly instead of <SiteHeader />.
 *
 *  Member sessions only. It used to read loadCurrentUser(), where a staff
 *  cookie outranks a member one, so an editor browsing the public site saw
 *  their admin account in the header — and IA-55 showed what that costs: after
 *  signing out of the cabinet the site still greeted them by name, and the
 *  header's Sign out (staff, for a staff row) then ended the admin session open
 *  in another tab. The admin panel has its own header; on the public site a
 *  browser holding only the staff cookie is a guest.
 *
 *  `knownUser` lets a caller that already resolved the screen's owner (e.g.
 *  /account/layout.tsx via requireMember()) hand it over directly. */
export async function getSiteHeaderUser(
  knownUser?: AuthedUser | null,
): Promise<SiteHeaderUser | null> {
  const authUser = knownUser !== undefined ? knownUser : await loadCurrentMember();
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
