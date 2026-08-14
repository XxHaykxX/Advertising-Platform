/* Per-channel attributes of a listing — the fields a billboard needs and a
   radio station does not (2026-08-14). Same convention as AD_CHANNELS
   (ad-channels.ts) and FORMAT_CATEGORY_VALUES (admin/projects/form-shared.ts):
   the closed list lives in TypeScript, the wording lives in the dictionary
   under the UPPERCASE token.

   Why one JSON column instead of one column per attribute: the sets barely
   overlap — `lighting` is null on every radio row, `stationFormat` on every
   billboard — so thirty-odd columns would be five filled and twenty-five NULL
   on any given row. The values are stored in `AdSpace.attrs` / `Project.attrs`
   as a JSON object, exactly the way `description`, `gallery`, `platforms` and
   `metrics` are already stored in this schema. Filtering is client-side
   anyway (see the note in the catalog view), so nothing here wants an index,
   and adding a tenth attribute later is a change to this file alone — no
   migration.

   Dictionary keys every attribute needs in src/lib/i18n.ts:
     attr.<KEY>                  — the facet label and the form field label
     attrValue.<KEY>.<VALUE>     — one per entry in `values`
   Numeric and boolean attributes need only the first. */

export type AdAttrType = "select" | "multiselect" | "number" | "boolean";

export type AttrDef = {
  /** Token used as the JSON key, the URL parameter and the dictionary suffix. */
  key: string;
  type: AdAttrType;
  /** Closed list for select/multiselect; absent for number/boolean. */
  values?: readonly string[];
};

/* ── Value lists shared by more than one channel ─────────────────────────── */

/** Billboards and transit both sell digital and static surfaces, and the
 *  buyer's first question is the same on either: can I rotate a creative. */
const SURFACE_KIND = ["DIGITAL", "STATIC"] as const;

/** Radio and TV sell by daypart, and the split is the one every rate card in
 *  the research uses. */
const DAYPART = ["MORNING", "DAYTIME", "DRIVE_TIME", "PRIME", "NIGHT"] as const;

/** Seconds. Kept as tokens rather than numbers because the facet is a set of
 *  checkboxes ("15 or 30"), not a range — nobody asks for "between 12 and 24
 *  seconds". */
const SPOT_LENGTH = ["S5", "S10", "S15", "S20", "S30", "S60"] as const;

/** Broadcast/creator content language. Armenian first — it is the default
 *  locale of the site and the majority of the inventory. */
const CONTENT_LANGUAGE = ["HY", "RU", "EN"] as const;

/* ── The directory ───────────────────────────────────────────────────────── */

export const AD_CHANNEL_ATTRS: Record<string, readonly AttrDef[]> = {
  BILLBOARD: [
    {
      key: "structureType",
      type: "select",
      values: ["BILLBOARD_3X6", "SUPERSITE", "CITY_FORMAT", "WALLSCAPE", "PRISMATRON", "SCREEN"],
    },
    { key: "surfaceKind", type: "select", values: SURFACE_KIND },
    { key: "lighting", type: "boolean" },
    // Which way the traffic it faces is heading. Priced differently on every
    // CIS catalogue in the research; the western ones don't carry it at all.
    { key: "trafficSide", type: "select", values: ["INBOUND", "OUTBOUND", "BOTH"] },
    { key: "district", type: "select", values: [] },
    { key: "surfaceSize", type: "select", values: ["S3X6", "S6X3", "S12X3", "S5X15", "OTHER"] },
  ],

  TRANSIT: [
    {
      key: "transportType",
      type: "select",
      values: ["BUS", "METRO", "MINIBUS", "TROLLEYBUS", "TAXI", "TRAIN"],
    },
    // Outside reaches pedestrians and other drivers, inside reaches a captive
    // passenger for the length of the ride — different products, same vehicle.
    { key: "vehicleSide", type: "select", values: ["EXTERIOR", "INTERIOR"] },
    {
      key: "brandingFormat",
      type: "select",
      values: ["FULL_WRAP", "SIDE", "REAR", "INTERIOR_CARD", "STICKER"],
    },
    { key: "route", type: "select", values: [] },
    { key: "surfaceKind", type: "select", values: SURFACE_KIND },
  ],

  LIFTS: [
    {
      key: "buildingType",
      type: "select",
      values: ["RESIDENTIAL", "OFFICE", "MALL", "HOTEL", "CLINIC", "UNIVERSITY"],
    },
    { key: "buildingSpot", type: "select", values: ["CABIN", "LOBBY", "ENTRANCE"] },
    { key: "mediaType", type: "select", values: ["SCREEN", "BOARD"] },
    { key: "buildingClass", type: "select", values: ["ECONOMY", "COMFORT", "BUSINESS", "ELITE"] },
    { key: "entrances", type: "number" },
    { key: "apartments", type: "number" },
    { key: "district", type: "select", values: [] },
  ],

  RADIO: [
    {
      key: "stationFormat",
      type: "select",
      values: ["POP", "ROCK", "FOLK", "NEWS", "TALK", "MIXED"],
    },
    { key: "daypart", type: "multiselect", values: DAYPART },
    { key: "spotLength", type: "multiselect", values: SPOT_LENGTH },
    // A host reading the copy live costs several times a produced spot and is
    // bought for different reasons — the buyer filters on it, not on price.
    { key: "spotKind", type: "select", values: ["SPOT", "SEGMENT_SPONSORSHIP", "HOST_READ"] },
    { key: "language", type: "multiselect", values: CONTENT_LANGUAGE },
    { key: "weekPart", type: "multiselect", values: ["WEEKDAYS", "WEEKEND"] },
  ],

  TV: [
    {
      key: "contentGenre",
      type: "multiselect",
      values: ["NEWS", "SPORT", "SERIES", "FILM", "KIDS", "ENTERTAINMENT", "DOCUMENTARY"],
    },
    { key: "daypart", type: "multiselect", values: DAYPART },
    { key: "spotLength", type: "multiselect", values: SPOT_LENGTH },
    { key: "spotKind", type: "select", values: ["SPOT", "SHOW_SPONSORSHIP", "TICKER"] },
    { key: "language", type: "multiselect", values: CONTENT_LANGUAGE },
    { key: "coverage", type: "select", values: ["NATIONAL", "REGIONAL"] },
  ],

  VIDEO: [
    {
      key: "platform",
      type: "select",
      values: ["YOUTUBE", "INSTAGRAM", "TIKTOK", "FACEBOOK", "WEBSITE", "OTT"],
    },
    {
      key: "contentTopic",
      type: "select",
      values: ["MUSIC", "COMEDY", "SPORT", "EDUCATION", "LIFESTYLE", "GAMING", "NEWS", "BUSINESS"],
    },
    { key: "subscribers", type: "number" },
    {
      key: "integrationFormat",
      type: "select",
      values: ["PRE_ROLL", "MID_ROLL", "POST_ROLL", "INTEGRATION", "REVIEW"],
    },
    { key: "spotLength", type: "multiselect", values: SPOT_LENGTH },
    { key: "language", type: "multiselect", values: CONTENT_LANGUAGE },
  ],

  BANNER: [
    {
      key: "siteTopic",
      type: "select",
      values: ["NEWS", "SPORT", "BUSINESS", "ENTERTAINMENT", "TECH", "LIFESTYLE", "CLASSIFIEDS"],
    },
    { key: "position", type: "select", values: ["HEADER", "SIDEBAR", "IN_FEED", "FOOTER"] },
    {
      key: "bannerSize",
      type: "select",
      values: ["S728X90", "S300X250", "S970X250", "S320X50", "S160X600", "OTHER"],
    },
    // Small advertisers understand "so much for a month"; larger ones buy by
    // the thousand impressions. Both models exist on the same page in the
    // research, so it is a filter rather than a platform-wide decision.
    { key: "pricingModel", type: "select", values: ["FLAT_PERIOD", "CPM"] },
    { key: "device", type: "multiselect", values: ["DESKTOP", "MOBILE"] },
    { key: "inventoryType", type: "select", values: ["WEBSITE", "SCREEN"] },
  ],

  /* The two PROJECT channels. Their attributes ride on Project.attrs; the
     facets a project already has (genre, format, platform, placement type,
     price, deadline, release date) stay where they are and are not repeated
     here. */

  PLACEMENT: [
    // The thing that sets this marketplace apart from Ryff/Rembrand: the
    // integration is sold before the film exists, and what can still be sold
    // depends on how far along it is — a story-level integration only at
    // script stage, a prop until the shoot wraps.
    {
      key: "productionStage",
      type: "select",
      values: ["SCRIPT", "PRE_PRODUCTION", "SHOOTING", "POST_PRODUCTION"],
    },
    // No ageRating here on purpose — Project already carries one as a real
    // column (schema.prisma, "16+"/"18+"/…). The brand-safety facet reads that
    // column; duplicating it in the bag would give two answers to one question.
    { key: "categoryExclusive", type: "boolean" },
    { key: "projectedReach", type: "number" },
  ],

  EVENTS: [
    {
      key: "eventCategory",
      type: "select",
      values: ["MUSIC", "SPORT", "FESTIVAL", "CONFERENCE", "CHARITY", "THEATRE", "EXHIBITION"],
    },
    { key: "attendance", type: "number" },
    { key: "eventMode", type: "select", values: ["OFFLINE", "ONLINE", "HYBRID"] },
    { key: "categoryExclusive", type: "boolean" },
  ],
};

/** `values: []` means "the list comes from the data, not from this file" —
 *  districts and bus routes are Armenian facts nobody wants to maintain as a
 *  TypeScript literal, so the owner types them and the facet is built from
 *  whatever ended up in the column. */
export function isOpenList(def: AttrDef): boolean {
  return def.values !== undefined && def.values.length === 0;
}

export function attrsFor(channelCode: string): readonly AttrDef[] {
  return AD_CHANNEL_ATTRS[channelCode] ?? [];
}

/** Dictionary suffix for an attribute's label and for one of its values. Both
 *  are built from the token so a new attribute never needs a `labelKey` field
 *  that can drift out of sync with `key`. */
export function attrLabelKey(key: string): string {
  return `attr.${key}`;
}

export function attrValueLabelKey(key: string, value: string): string {
  return `attrValue.${key}.${value}`;
}

/**
 * The only gate between a form submission and the stored `attrs` JSON.
 *
 * Same role `normalizeAdSpaceChannel` plays for the channel column: the column
 * is free-form text, so nothing at the database level stops a hand-crafted
 * POST from writing `{"lighting": "maybe"}` onto a radio station. Every save
 * path runs its values through here. Anything the directory does not know —
 * an attribute that does not belong to this channel, a value outside the
 * closed list, a number that is not one — is dropped, never stored.
 *
 * Takes one channel code (every AdSpace channel) or several (a Project, which
 * has no single channel of its own — it can sell PLACEMENT and/or EVENTS at
 * once, sharing one `attrs` column between them; see the note on
 * Project.attrs in schema.prisma). A shared key like categoryExclusive is
 * validated once either way — attrsFor() de-dupes nothing, but the loop
 * writing `out[def.key]` is idempotent for the same input.
 *
 * Returns null when nothing survives, so the caller writes NULL rather than
 * the string "{}".
 */
export function normalizeAttrs(
  channelCodes: string | readonly string[],
  input: Record<string, unknown> | null | undefined,
): string | null {
  if (input == null) return null;
  const out: Record<string, string | number | boolean | string[]> = {};
  const codes = Array.isArray(channelCodes) ? channelCodes : [channelCodes as string];

  for (const def of codes.flatMap((c) => attrsFor(c))) {
    const raw = input[def.key];
    if (raw == null || raw === "") continue;

    switch (def.type) {
      case "boolean": {
        // A checkbox reaches a server action as "on"/"true"/true, and an
        // unchecked one does not reach it at all — so only a truthy value is
        // ever stored, and "false" is the absence of the key.
        if (raw === true || raw === "true" || raw === "on") out[def.key] = true;
        break;
      }
      case "number": {
        const n = typeof raw === "number" ? raw : Number(String(raw).trim());
        if (Number.isFinite(n) && n >= 0) out[def.key] = Math.round(n);
        break;
      }
      case "select": {
        const v = String(raw).trim();
        if (!v) break;
        if (isOpenList(def) || def.values?.includes(v)) out[def.key] = v;
        break;
      }
      case "multiselect": {
        const list = (Array.isArray(raw) ? raw : [raw])
          .map((v) => String(v).trim())
          .filter((v) => v !== "" && (isOpenList(def) || (def.values?.includes(v) ?? false)));
        // Dedupe: a form can post the same checkbox name twice after a
        // hydration hiccup, and a doubled value would double-count in facets.
        const unique = [...new Set(list)];
        if (unique.length > 0) out[def.key] = unique;
        break;
      }
    }
  }

  return Object.keys(out).length > 0 ? JSON.stringify(out) : null;
}

/** The read side. A malformed or hand-edited column yields an empty object
 *  rather than throwing halfway through rendering a page. */
export function parseAttrs(stored: string | null | undefined): Record<string, unknown> {
  if (!stored) return {};
  try {
    const parsed: unknown = JSON.parse(stored);
    return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

/** Flattened attribute values for the search haystack, so typing "билборд
 *  3х6" or "prime" finds the listing without every facet growing its own
 *  search box. Tokens only — the localized wording is added by the caller
 *  that has a dictionary. Takes the already-parsed object — a DTO's `attrs`
 *  is parsed once, server-side (see src/lib/types.ts), so a haystack builder
 *  reusing it should not have to re-parse the JSON string it came from. */
export function attrValueTokens(parsed: Record<string, unknown>): string[] {
  const out: string[] = [];
  for (const value of Object.values(parsed)) {
    if (Array.isArray(value)) out.push(...value.map(String));
    else if (typeof value === "string") out.push(value);
  }
  return out;
}

/** Same as attrValueTokens, from the raw stored column — for callers (like
 *  ad-channel-attrs.test.ts) that only have the JSON string on hand. */
export function attrTokens(stored: string | null | undefined): string[] {
  return attrValueTokens(parseAttrs(stored));
}
