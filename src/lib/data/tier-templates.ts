import "server-only";
import { prisma } from "@/lib/prisma";
import { mergeTierTemplates } from "@/app/admin/(panel)/projects/form-shared";

export type TierTemplate = {
  name: string;
  /** Newline-separated, the shape the tier editor works in. */
  benefits: string;
  /** How many placements across the catalogue carry this name. */
  uses: number;
};

/**
 * Ready-made placements for the project form's "Add Placement" menu.
 *
 * Derived from the tiers that already exist rather than a hard-coded list:
 * placements repeat across projects ("Official Sponsor", "Product placement"),
 * and a fixed dictionary would drift from what the catalogue actually offers.
 * Whatever an editor writes once is offered on the next project for free.
 *
 * Price is deliberately NOT carried over — it's the one field that is always
 * project-specific, and a stale number is worse than an empty one. Grouping
 * rules live in form-shared.ts (mergeTierTemplates), where they're unit-tested.
 *
 * Scoped to APPROVED projects (2026-08-07): this reads every tier in the
 * database, and the form that shows the suggestions is open to creators — so a
 * package name typed into a project still sitting in moderation, or one that
 * was rejected, was being offered to everyone else as a ready-made template.
 * A published listing is content we already stand behind.
 */
export async function getTierTemplates(limit = 12): Promise<TierTemplate[]> {
  const rows = await prisma.sponsorshipTier.findMany({
    where: { project: { moderationStatus: "APPROVED" } },
    select: { name: true, benefits: true },
  });
  return mergeTierTemplates(rows, limit);
}
