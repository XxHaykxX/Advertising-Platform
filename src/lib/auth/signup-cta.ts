import "server-only";
import { loadCurrentMember } from "@/lib/auth/require";
import { canBuy, canSell } from "@/lib/auth/capabilities";

/* Where a "sign up and start selling / buying" call to action should actually
   send the person clicking it (IA-53).
 *
 * These buttons were hardcoded to /register. For a visitor that is right; for
 * someone already signed in it offered to register an account they are sitting
 * in. Since 2026-08-11 /register bounces a signed-in member to their cabinet,
 * so the click was not a dead end any more — but it still took two hops and
 * the button still said "register" to a registered user.
 *
 * The same shape as the dead-end fix that day: the decision belongs to one
 * helper the entry points share, not to each link. */
export async function signupCtaHref(side: "creator" | "brand"): Promise<string> {
  const member = await loadCurrentMember();
  // Guests — and staff, who have no member session — get the sign-up form.
  if (!member) return `/register?role=${side}`;
  if (side === "creator") {
    // A member who already sells goes straight to the submit form; one who
    // only buys goes to their own cabinet, where the side switcher is what
    // turns selling on (A5).
    return canSell(member) ? "/account/projects/new" : "/account/brand";
  }
  return canBuy(member) ? "/account/brand" : "/account";
}
