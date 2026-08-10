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
    select: { avatar: true },
  });

  return {
    name: authUser.name,
    email: authUser.email,
    role: authUser.role,
    avatar: dbUser?.avatar ?? null,
  };
}
