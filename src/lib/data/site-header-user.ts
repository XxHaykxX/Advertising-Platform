import "server-only";
import { loadCurrentUser } from "@/lib/auth/require";
import { prisma } from "@/lib/prisma";
import type { SiteHeaderUser } from "@/components/header";

/** Soft-loads the current session's user in the shape Header needs (adds
 *  `avatar`, which AuthedUser doesn't carry). Returns null for guests —
 *  never redirects. Shared by SiteHeader and the client-view pages
 *  (catalog, portfolio) that render <Header> directly instead of
 *  <SiteHeader />. */
export async function getSiteHeaderUser(): Promise<SiteHeaderUser | null> {
  const authUser = await loadCurrentUser();
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
