// Which header nav a signed-in member sees. Split out of header.tsx (a "use
// client" component pulling framer-motion and next/navigation) purely so the
// predicate is unit-testable in the node-environment vitest run.
import { canBuy } from "@/lib/auth/capabilities";
import type { MemberSides } from "@/lib/auth/capabilities";

/** The creator cabinet — everything under /account except the brand side.
 *  "Mode lives in the URL": a dual member's flags can't say which cabinet
 *  they're currently in, only the path can. */
export function inCreatorCabinet(pathname: string | null): boolean {
  const path = pathname ?? "";
  return path.startsWith("/account") && !path.startsWith("/account/brand");
}

/** IA-46's two promoted brand cabinet links (dashboard + favorites). Shown to
 *  anyone who can buy, everywhere except the creator cabinet — including the
 *  public pages, where `isMember` already hides the marketing nav and gating
 *  this on /account/brand left the nav bar completely empty. */
export function showsBrandNav(
  user: MemberSides | null | undefined,
  pathname: string | null,
): boolean {
  return canBuy(user) && !inCreatorCabinet(pathname);
}
