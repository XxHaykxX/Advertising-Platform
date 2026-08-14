import { describe, it, expect } from "vitest";
import { AD_CHANNELS } from "./ad-channels";
import {
  AD_CHANNEL_ATTRS,
  attrTokens,
  attrsFor,
  normalizeAttrs,
  parseAttrs,
} from "./ad-channel-attrs";

describe("AD_CHANNEL_ATTRS directory", () => {
  it("covers every channel in the directory", () => {
    for (const channel of AD_CHANNELS) {
      expect(attrsFor(channel.code).length, `${channel.code} has no attributes`).toBeGreaterThan(0);
    }
  });

  it("has no channel that isn't a real channel", () => {
    const codes = new Set(AD_CHANNELS.map((c) => c.code));
    for (const code of Object.keys(AD_CHANNEL_ATTRS)) {
      expect(codes.has(code), `${code} is not in AD_CHANNELS`).toBe(true);
    }
  });

  it("keeps attribute keys unique within a channel", () => {
    for (const [code, defs] of Object.entries(AD_CHANNEL_ATTRS)) {
      const keys = defs.map((d) => d.key);
      expect(new Set(keys).size, `${code} repeats an attribute key`).toBe(keys.length);
    }
  });

  it("gives select/multiselect a values array and leaves number/boolean without one", () => {
    for (const defs of Object.values(AD_CHANNEL_ATTRS)) {
      for (const def of defs) {
        if (def.type === "select" || def.type === "multiselect") {
          expect(Array.isArray(def.values), `${def.key} needs values`).toBe(true);
        } else {
          expect(def.values, `${def.key} should not carry values`).toBeUndefined();
        }
      }
    }
  });
});

describe("normalizeAttrs", () => {
  it("keeps a value from the closed list", () => {
    expect(normalizeAttrs("BILLBOARD", { structureType: "SUPERSITE" })).toBe(
      '{"structureType":"SUPERSITE"}',
    );
  });

  it("drops a value that isn't in the closed list", () => {
    expect(normalizeAttrs("BILLBOARD", { structureType: "BALLOON" })).toBeNull();
  });

  it("drops an attribute that belongs to another channel", () => {
    // stationFormat is radio's; a billboard carrying it is a crafted POST.
    expect(normalizeAttrs("BILLBOARD", { stationFormat: "ROCK" })).toBeNull();
  });

  it("accepts free text where the list is open", () => {
    expect(normalizeAttrs("BILLBOARD", { district: "Կենտրոն" })).toBe('{"district":"Կենտրոն"}');
  });

  it("stores a checked box as true and forgets an unchecked one", () => {
    expect(normalizeAttrs("BILLBOARD", { lighting: "on" })).toBe('{"lighting":true}');
    expect(normalizeAttrs("BILLBOARD", { lighting: "" })).toBeNull();
    expect(normalizeAttrs("BILLBOARD", { lighting: false })).toBeNull();
  });

  it("rounds a number and refuses a non-number", () => {
    expect(normalizeAttrs("LIFTS", { apartments: "120.4" })).toBe('{"apartments":120}');
    expect(normalizeAttrs("LIFTS", { apartments: "many" })).toBeNull();
    expect(normalizeAttrs("LIFTS", { apartments: "-3" })).toBeNull();
  });

  it("dedupes a multiselect and filters its members", () => {
    expect(normalizeAttrs("RADIO", { daypart: ["PRIME", "PRIME", "TEATIME"] })).toBe(
      '{"daypart":["PRIME"]}',
    );
  });

  it("returns null rather than an empty object", () => {
    expect(normalizeAttrs("RADIO", {})).toBeNull();
    expect(normalizeAttrs("RADIO", null)).toBeNull();
    expect(normalizeAttrs("NOT_A_CHANNEL", { anything: "x" })).toBeNull();
  });
});

describe("parseAttrs / attrTokens", () => {
  it("survives a malformed column", () => {
    expect(parseAttrs("{not json")).toEqual({});
    expect(parseAttrs("[1,2]")).toEqual({});
    expect(parseAttrs(null)).toEqual({});
  });

  it("flattens strings and arrays for the search haystack, skipping numbers and flags", () => {
    const stored = normalizeAttrs("RADIO", {
      stationFormat: "ROCK",
      daypart: ["PRIME", "NIGHT"],
    });
    expect(attrTokens(stored).sort()).toEqual(["NIGHT", "PRIME", "ROCK"]);
  });
});
