import { describe, it, expect } from "vitest";
import {
  adSpacePublishBlockers,
  buildAdSpaceData,
  nextAdSpaceCode,
  parseAdSpaceOfferRows,
  validateAdSpace,
  EMPTY_AD_SPACE,
} from "./form-shared";
import { adSpaceScalars } from "./write";

// The translator the actions pass in — here it just echoes the key, which is
// what makes "which message" assertable without loading the dictionary.
const t = (key: string) => key;

describe("nextAdSpaceCode", () => {
  it("starts at 0001 when the year has no codes yet", () => {
    expect(nextAdSpaceCode([], 2026)).toBe("#AS-2026-0001");
  });

  it("continues past the highest sequence, not the count", () => {
    expect(nextAdSpaceCode(["#AS-2026-0001", "#AS-2026-0009", "#AS-2026-0003"], 2026)).toBe("#AS-2026-0010");
  });

  it("ignores project codes and anything malformed", () => {
    expect(nextAdSpaceCode(["#PP-2026-0500", "#AS-2026-abc", "#AS-2026-0002"], 2026)).toBe("#AS-2026-0003");
  });
});

describe("validateAdSpace", () => {
  const base = { ...EMPTY_AD_SPACE, channel: "BILLBOARD", titleHy: "Վահանակ" };

  it("refuses a channel that is not an AD_SPACE channel", () => {
    // PLACEMENT is a real channel, but it is sold through a project.
    expect(validateAdSpace({ ...base, channel: "PLACEMENT" }, t)).toBe("adSpaceForm.errChannelRequired");
    expect(validateAdSpace({ ...base, channel: "BILBOARD" }, t)).toBe("adSpaceForm.errChannelRequired");
  });

  it("accepts a title filled in any single locale", () => {
    expect(validateAdSpace({ ...base, titleHy: "", titleEn: "Board" }, t)).toBeNull();
  });

  it("refuses an empty title", () => {
    expect(validateAdSpace({ ...base, titleHy: "" }, t)).toBe("adSpaceForm.errTitleRequired");
  });

  it("refuses an availability window that ends before it starts", () => {
    expect(
      validateAdSpace({ ...base, availableFrom: "2026-09-01", availableTo: "2026-08-01" }, t),
    ).toBe("adSpaceForm.errDateOrder");
  });
});

describe("adSpacePublishBlockers", () => {
  it("blocks a space with nothing to buy", () => {
    expect(adSpacePublishBlockers({ sizeFormat: "3×6 м" }, 0)).toEqual(["adSpace.publish.offers"]);
  });

  it("passes a space with an offer and a stated size", () => {
    expect(adSpacePublishBlockers({ sizeFormat: "3×6 м" }, 1)).toEqual([]);
  });
});

describe("parseAdSpaceOfferRows", () => {
  function fd(rows: unknown) {
    const f = new FormData();
    f.set("offersRows", JSON.stringify(rows));
    return f;
  }

  it("drops rows with no name in any locale and keeps the rest", () => {
    const rows = parseAdSpaceOfferRows(
      fd([{ nameHy: "", nameRu: "", nameEn: "" }, { nameRu: "Месяц", priceAmd: 120000 }]),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].nameRu).toBe("Месяц");
    expect(rows[0].priceAmd).toBe(120000);
  });

  it("keeps a null price as null (on request) rather than turning it into 0", () => {
    expect(parseAdSpaceOfferRows(fd([{ nameEn: "Week", priceAmd: null }]))[0].priceAmd).toBeNull();
  });

  it("survives a malformed payload", () => {
    const f = new FormData();
    f.set("offersRows", "{not json");
    expect(parseAdSpaceOfferRows(f)).toEqual([]);
  });
});

describe("attrs: FormData -> buildAdSpaceData -> adSpaceScalars (the normalizeAttrs gate)", () => {
  function fd(channel: string, attrs: unknown) {
    const f = new FormData();
    f.set("channel", channel);
    f.set("titleHy", "Վահանակ");
    f.set("attrs", JSON.stringify(attrs));
    return f;
  }

  it("keeps a value in the channel's closed list, drops one outside it, drops an attribute the channel doesn't own", () => {
    const data = buildAdSpaceData(
      fd("BILLBOARD", {
        surfaceKind: "DIGITAL", // valid BILLBOARD value
        lighting: "not a color", // not "true"/true/"on" -> dropped by normalizeAttrs' boolean case
        stationFormat: "POP", // a RADIO attribute — BILLBOARD doesn't carry this key at all
      }),
    );
    // buildAdSpaceData itself is trust-free (same as every other field here) —
    // the raw record round-trips untouched until the write boundary.
    expect(data.attrs).toEqual({
      surfaceKind: "DIGITAL",
      lighting: "not a color",
      stationFormat: "POP",
    });

    const stored = JSON.parse(adSpaceScalars(data).attrs ?? "{}");
    expect(stored).toEqual({ surfaceKind: "DIGITAL" });
  });

  it("passes free text through for an open-list attribute (district)", () => {
    const data = buildAdSpaceData(fd("BILLBOARD", { district: "Kentron" }));
    const stored = JSON.parse(adSpaceScalars(data).attrs ?? "{}");
    expect(stored).toEqual({ district: "Kentron" });
  });

  it("writes null, not the string \"{}\", when nothing survives", () => {
    const data = buildAdSpaceData(fd("BILLBOARD", { stationFormat: "POP" }));
    expect(adSpaceScalars(data).attrs).toBeNull();
  });
});
