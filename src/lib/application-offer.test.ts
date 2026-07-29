import { describe, it, expect } from "vitest";
import { offerValue, parseOfferValue } from "@/lib/offer-value";

/* The application picker holds two different tables in one <select> (product
   placements and sponsorship packages), so the option value has to carry which
   table the row came from — placement 3 and tier 3 both exist, and picking the
   wrong one would attach the brand's offer to a different product at a
   different price. These pin the encoding both ways. */

describe("offerValue / parseOfferValue", () => {
  it("round-trips a placement", () => {
    expect(parseOfferValue(offerValue({ id: 3, kind: "PLACEMENT" }))).toEqual({ kind: "PLACEMENT", id: 3 });
  });

  it("round-trips a tier", () => {
    expect(parseOfferValue(offerValue({ id: 3, kind: "TIER" }))).toEqual({ kind: "TIER", id: 3 });
  });

  it("keeps the two apart at the same id", () => {
    expect(offerValue({ id: 3, kind: "PLACEMENT" })).not.toBe(offerValue({ id: 3, kind: "TIER" }));
  });

  it("returns null for the empty selection", () => {
    // The "not selected — let's discuss" option, which must stay allowed.
    expect(parseOfferValue("")).toBeNull();
  });

  it("returns null for anything malformed", () => {
    // Reached only by a crafted POST; the server re-checks project ownership
    // anyway, but a NaN id must never make it that far.
    expect(parseOfferValue("X:3")).toBeNull();
    expect(parseOfferValue("P:abc")).toBeNull();
    expect(parseOfferValue("P:0")).toBeNull();
    expect(parseOfferValue("P:-1")).toBeNull();
    expect(parseOfferValue("3")).toBeNull();
  });
});
