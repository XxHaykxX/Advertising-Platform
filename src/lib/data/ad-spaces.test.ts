import { describe, it, expect } from "vitest";
import { toListDTO } from "./ad-spaces";

// Pure mapper, no DB — parseAttrs itself has the exhaustive cases
// (ad-channel-attrs.test.ts); this just confirms the DTO wiring actually
// calls it instead of passing the raw column through (2026-08-14, stage 3).
const RATES = { AMD: 1, USD: 0.00272, EUR: 0.00238, RUB: 0.208 };
const BASE_ROW = {
  id: 1,
  code: "SPACE-1",
  channel: "BILLBOARD",
  title: "Test",
  titleHy: "",
  titleRu: "",
  titleEn: "",
  city: "Yerevan",
  address: "",
  sizeFormat: "",
  reachPerDay: null,
  image: null,
  createdAt: new Date("2026-01-01"),
  offers: [],
};

describe("toListDTO attrs", () => {
  it("NULL column -> {}", () => {
    const dto = toListDTO("en", "AMD", RATES, { ...BASE_ROW, attrs: null });
    expect(dto.attrs).toEqual({});
  });

  it("malformed JSON -> {} instead of throwing", () => {
    const dto = toListDTO("en", "AMD", RATES, { ...BASE_ROW, attrs: "{not json" });
    expect(dto.attrs).toEqual({});
  });

  it("valid JSON -> parsed object", () => {
    const dto = toListDTO("en", "AMD", RATES, {
      ...BASE_ROW,
      attrs: '{"lighting":true}',
    });
    expect(dto.attrs).toEqual({ lighting: true });
  });
});
