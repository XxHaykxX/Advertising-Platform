import { redirect } from "next/navigation";

/** The creator's brand-offer inbox lived here until 2026-08-07. Owner decision:
 *  a brand's application is negotiated by staff end to end (/admin/interests),
 *  so the creator never sees the brand's contacts, budget or the accept/decline
 *  buttons any more — see src/lib/actions/interest-response.ts.
 *
 *  The route survives as a redirect rather than a 404 because notifications
 *  already written to the database point at it: every "brand X is interested"
 *  row created before today carries link: "/account/interests", and clicking
 *  one from the bell would otherwise dead-end. Safe to delete once those have
 *  aged out. */
export default function RemovedInterestsPage() {
  redirect("/account/notifications");
}
