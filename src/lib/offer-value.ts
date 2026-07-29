/** Encoding for "which thing on this project is being applied for".
 *
 *  Lives here rather than next to the application popup because both sides of
 *  the page need it: the popup (a client component) parses it, and the offer
 *  cards (server components, since 2026-07-29 each carries its own apply
 *  button) build it. A function exported from a "use client" module cannot be
 *  called on the server at all — the render throws — so the shared bit had to
 *  come out into a plain module.
 *
 *  The kind has to travel with the id: an id alone is ambiguous, since
 *  placement 3 and sponsorship tier 3 both exist. Re-checked server-side
 *  against the project when the application is submitted. */
export type OfferKind = "PLACEMENT" | "TIER";

export function offerValue(offer: { id: number; kind: OfferKind }): string {
  return `${offer.kind === "PLACEMENT" ? "P" : "T"}:${offer.id}`;
}

/** What an application is stored against (Interest.offerKey). The same
 *  encoding the picker uses above, so an offer card's value and the row it
 *  produces are the same string — with one extra case the picker has no need
 *  for: "-" is "the brand named no particular offer", which is a thing you can
 *  only apply for once per project. */
export const NO_OFFER_KEY = "-";

export function offerKeyOf(tierId: number | null, placementId: number | null): string {
  if (placementId != null) return offerValue({ id: placementId, kind: "PLACEMENT" });
  if (tierId != null) return offerValue({ id: tierId, kind: "TIER" });
  return NO_OFFER_KEY;
}

export function parseOfferValue(value: string): { kind: OfferKind; id: number } | null {
  const [prefix, rawId] = value.split(":");
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) return null;
  if (prefix === "P") return { kind: "PLACEMENT", id };
  if (prefix === "T") return { kind: "TIER", id };
  return null;
}
