"use server";

import { requireMember } from "@/lib/auth/require";
import { getPendingInterestCountForOwner } from "@/lib/data/interests";

/** Offers on this creator's projects that are still waiting for an answer —
   drives the cabinet sidebar badge. The count already existed in the data
   layer but nothing displayed it, so a creator had no sign an offer had
   arrived unless they opened the section or caught the email. */
export async function getPendingOfferCountForMe(): Promise<number> {
  const user = await requireMember();
  if (user.role !== "CREATOR") return 0;
  return getPendingInterestCountForOwner(user.id);
}
