import { describe, it, expect } from "vitest";
import { parseMetrics, formatMetricLabel } from "./metrics";

describe("parseMetrics", () => {
  it("parses a valid JSON object of string values", () => {
    expect(parseMetrics('{"views":"310K","recall":"+34%"}')).toEqual({
      views: "310K",
      recall: "+34%",
    });
  });

  it("drops non-string values (defensive against dirty data)", () => {
    expect(parseMetrics('{"views":"310K","count":42,"ok":true}')).toEqual({ views: "310K" });
  });

  it("returns {} for malformed JSON", () => {
    expect(parseMetrics("{not json")).toEqual({});
    expect(parseMetrics("")).toEqual({});
  });

  it("returns {} for non-object JSON (array/scalar)", () => {
    expect(parseMetrics('["views","recall"]')).toEqual({});
    expect(parseMetrics('"310K"')).toEqual({});
    expect(parseMetrics("null")).toEqual({});
  });
});

describe("formatMetricLabel", () => {
  it("splits camelCase into Title-Cased words", () => {
    expect(formatMetricLabel("storeVisits")).toBe("Store Visits");
    expect(formatMetricLabel("recallDurability")).toBe("Recall Durability");
  });

  it("upper-cases short (<=3 char) tokens", () => {
    expect(formatMetricLabel("ctr")).toBe("CTR");
  });

  it("title-cases a single long word", () => {
    expect(formatMetricLabel("views")).toBe("Views");
    expect(formatMetricLabel("sentiment")).toBe("Sentiment");
  });
});
