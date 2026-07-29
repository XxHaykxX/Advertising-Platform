import { describe, it, expect } from "vitest";
import { offerKeyOf, offerValue, parseOfferValue, NO_OFFER_KEY } from "@/lib/offer-value";

/* offerKeyOf feeds Interest.offerKey, and @@unique([brandId, projectId, offerKey])
   is what replaced the old (brandId, projectId) uniqueness — the bug where a
   brand's second application silently overwrote the first (deal + booked slot
   included). These pin the exact string the DB constraint is built on. */

describe("offerKeyOf", () => {
  it("prefers the placement when both ids are somehow present", () => {
    // The picker only ever sends one of the two, but the offer itself is the
    // placement whenever one is chosen — this is the tie-break the callers rely on.
    expect(offerKeyOf(null, 5)).toBe("P:5");
  });

  it("falls back to the tier when there is no placement", () => {
    expect(offerKeyOf(3, null)).toBe("T:3");
  });

  it("uses a stable key for 'no particular offer'", () => {
    // Naming no offer is still one application per project, not one per submission.
    expect(offerKeyOf(null, null)).toBe(NO_OFFER_KEY);
  });

  it("keeps a placement and a tier apart at the same id", () => {
    // Without the prefix, an application for tier 7 and one for placement 7
    // would collide on the unique constraint and the second would fail to
    // insert as a distinct application — the whole point of the prefix.
    expect(offerKeyOf(7, null)).not.toBe(offerKeyOf(null, 7));
  });

  it("matches what the offer card puts in the apply button", () => {
    // offer-value.ts is the single source both sides read from; if this ever
    // diverges, submitting from the card creates a new row instead of
    // updating the brand's existing application for that offer.
    expect(offerKeyOf(null, 5)).toBe(offerValue({ id: 5, kind: "PLACEMENT" }));
    expect(offerKeyOf(3, null)).toBe(offerValue({ id: 3, kind: "TIER" }));
  });

  it("round-trips through parseOfferValue for both kinds", () => {
    expect(parseOfferValue(offerKeyOf(null, 42))).toEqual({ kind: "PLACEMENT", id: 42 });
    expect(parseOfferValue(offerKeyOf(42, null))).toEqual({ kind: "TIER", id: 42 });
  });

  it("parses the empty-selection key back to null", () => {
    // "-" is not a reference to any offer, unlike every "P:n" / "T:n" key.
    expect(parseOfferValue(NO_OFFER_KEY)).toBeNull();
  });

  it("fits the offerKey column at a realistically large id", () => {
    // Interest.offerKey is @db.VarChar(24); a silently truncated key would
    // make two different offers collide on the unique constraint.
    expect(offerKeyOf(null, 999999999).length).toBeLessThanOrEqual(24);
    expect(offerKeyOf(999999999, null).length).toBeLessThanOrEqual(24);
  });
});
