import { describe, it, expect } from "vitest";
import { buildAdSpaceData } from "./form-shared";
import { adSpaceScalars, toAdSpaceFormInitial } from "./write";

function fd(entries: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
}

const BILLBOARD_ATTRS = {
  structureType: "SUPERSITE",
  surfaceKind: "DIGITAL",
  trafficSide: "INBOUND",
  surfaceSize: "S6X3",
  lighting: true,
  district: "Kentron QA",
};

describe("ad space attrs round trip", () => {
  it("survives form -> scalars -> row -> form initial", () => {
    const data = buildAdSpaceData(
      fd({ titleHy: "QA", channel: "BILLBOARD", attrs: JSON.stringify(BILLBOARD_ATTRS) }),
    );
    const scalars = adSpaceScalars(data);
    expect(JSON.parse(scalars.attrs!)).toEqual(BILLBOARD_ATTRS);

    const back = toAdSpaceFormInitial({
      code: "x", titleHy: "QA", titleRu: "", titleEn: "",
      descriptionHy: null, descriptionRu: null, descriptionEn: null,
      offersHy: null, offersRu: null, offersEn: null,
      channel: "BILLBOARD", city: null, address: null, sizeFormat: null,
      reachPerDay: null, sides: null, priceFrom: null, availableFrom: null,
      availableTo: null, image: null, gallery: null, isActive: true,
      attrs: scalars.attrs,
    } as never);
    expect(back.attrs).toEqual(BILLBOARD_ATTRS);
  });

  it("switching channel drops the old channel's attrs", () => {
    const data = buildAdSpaceData(
      fd({ titleHy: "QA", channel: "RADIO", attrs: JSON.stringify(BILLBOARD_ATTRS) }),
    );
    expect(adSpaceScalars(data).attrs).toBeNull();
  });

  it("radio multiselects survive", () => {
    const radio = { stationFormat: "POP", daypart: ["MORNING", "PRIME"], spotLength: ["S15", "S30"], language: ["HY", "RU"], weekPart: ["WEEKDAYS"], spotKind: "HOST_READ" };
    const data = buildAdSpaceData(fd({ titleHy: "QA", channel: "RADIO", attrs: JSON.stringify(radio) }));
    expect(JSON.parse(adSpaceScalars(data).attrs!)).toEqual(radio);
  });

  it("negative and junk numbers are dropped", () => {
    const data = buildAdSpaceData(
      fd({ titleHy: "QA", channel: "LIFTS", attrs: JSON.stringify({ entrances: -5, apartments: "abc", buildingType: "OFFICE" }) }),
    );
    expect(JSON.parse(adSpaceScalars(data).attrs!)).toEqual({ buildingType: "OFFICE" });
  });
});
