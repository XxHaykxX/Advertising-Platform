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

export function parseOfferValue(value: string): { kind: OfferKind; id: number } | null {
  const [prefix, rawId] = value.split(":");
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) return null;
  if (prefix === "P") return { kind: "PLACEMENT", id };
  if (prefix === "T") return { kind: "TIER", id };
  return null;
}
