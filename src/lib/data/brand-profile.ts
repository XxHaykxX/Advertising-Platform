import "server-only";
import { prisma } from "@/lib/prisma";
import { parseStringArray } from "@/lib/data/format";

/** A BRAND member's own profile — the fields added to User for #23 (brand
 *  cabinet). Not cached (unstable_cache): this is a single-row, owner-scoped
 *  read on a low-traffic page, and the owner edits it themselves, so a stale
 *  cache would be more surprising than a cheap extra query. */
export type BrandProfileDTO = {
  id: number;
  email: string;
  name: string;
  company: string;
  website: string;
  /** The callback number the seller gets with every application. Editable here
   *  since 2026-07-29 — until then the only way a brand's phone was ever set
   *  was the popup asking for it, so a brand that had answered once still
   *  couldn't correct a typo, and one that hadn't was asked every time. */
  phone: string;
  brandCategories: string[];
  budgetRange: string;
};

export async function getBrandProfile(userId: number): Promise<BrandProfileDTO | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      company: true,
      website: true,
      phone: true,
      brandCategories: true,
      budgetRange: true,
    },
  });
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    company: user.company ?? "",
    website: user.website ?? "",
    phone: user.phone ?? "",
    brandCategories: parseStringArray(user.brandCategories),
    budgetRange: user.budgetRange ?? "",
  };
}
