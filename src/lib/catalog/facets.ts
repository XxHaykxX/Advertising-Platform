/* The catalogue's filter facets as data instead of seven hand-rolled
 * useState/toggle/JSX triples in ads-view.tsx (stage 2 of the ads/catalog
 * merge, 2026-08-14). Adding a facet used to mean touching eight places —
 * this file is now the one place; ads-view.tsx just loops over it.
 *
 * The first seven facets below (BASE_FACETS) are the ones that already
 * existed (catalog-view.tsx's old CheckboxFilter blocks), moved in with
 * their behaviour unchanged. Stage 3 (2026-08-14) adds the rest: ATTR_FACETS
 * is generated from AD_CHANNEL_ATTRS (ad-channel-attrs.ts) — see
 * collectAttrDefs() below — and EVENT_FACETS hand-writes the two EVENTS
 * columns (eventCategory, eventDate) that live outside `attrs` entirely;
 * the third, eventCity, is folded into BASE_FACETS' existing `city` instead.
 */

import type { CatalogRow } from "@/app/ads/ads-view";
import { AD_CHANNELS } from "@/lib/ad-channels";
import {
  AD_CHANNEL_ATTRS,
  attrLabelKey,
  attrValueLabelKey,
  isOpenList,
  type AttrDef,
} from "@/lib/ad-channel-attrs";
import {
  FORMAT_CATEGORY_VALUES,
  PLACEMENT_TYPE_VALUES,
} from "@/app/admin/(panel)/projects/form-shared";
import { parseStringArray, splitCountries } from "@/lib/data/format";
import { localizeCity } from "@/lib/cities";
import type { Locale } from "@/lib/i18n-client";

export type FacetControl = "checkbox" | "range" | "dateRange" | "toggle";

export type FacetContext = {
  locale: Locale;
  t: (key: string, vars?: Record<string, string | number>) => string;
  localize: (prefix: string, value: string | null | undefined) => string;
};

export type Facet = {
  /** Query-string name, state key, and (for label/optionLabel below) the
   *  dictionary suffix a facet built from ad-channel-attrs.ts would use. */
  key: string;
  control: FacetControl;
  /** Where this facet is offered: "ALL" channel pages (and the general
   *  page), or only the listed AD_CHANNELS codes. facetsFor() below reads
   *  this — the general /ads page ignores it and always gets everything. */
  channels: "ALL" | readonly string[];
  /** Filters, but is never rendered — see the `country` entry below. */
  hidden?: true;
  /** Which rows an option list is built from: every OTHER facet's options
   *  narrow by the channel picked ("channelFiltered", the default) — the
   *  channel facet's own options must not narrow by itself, so it opts into
   *  the full row set ("rows"). See ads-view.tsx's channelFiltered. */
  optionsScope?: "rows" | "channelFiltered";
  /** Section header text. Omitted on hidden facets, which render nothing. */
  label?: (ctx: FacetContext) => string;
  /** Raw option values, built from data — "no data, no facet" (and no dead
   *  checkboxes) is the whole point of computing these instead of listing a
   *  closed set. Omitted on hidden facets. */
  options?: (rows: CatalogRow[], ctx: FacetContext) => string[];
  /** Value → checkbox label. Omitted on hidden facets. */
  optionLabel?: (value: string, ctx: FacetContext) => string;
  /** Does this row match the selection? Only called with a non-empty
   *  `selected`. A row of the wrong kind (an ad space against a project-only
   *  facet, or vice versa) always returns false here — that's what makes
   *  picking a genre also drop every billboard out of the list, with no
   *  separate "kind" control anywhere (ex-plan B3). */
  matches: (row: CatalogRow, selected: string[]) => boolean;
};

/** The city facet's value for a row, whichever kind it is — an ad space's
 *  own `city`, or an EVENTS project's `eventCity` (2026-08-14, stage 3; see
 *  the `city` facet below for why they share one facet). "" for a row with
 *  neither, which options()/matches() below both treat as "no city here". */
function cityFacetValue(row: CatalogRow): string {
  return row.kind === "AD_SPACE" ? row.space.city : row.project.eventCity;
}

// The seven facets that predate this file (moved in from catalog-view.tsx,
// stage 2). Stage 3's generated attribute facets (ATTR_FACETS below) are
// appended after these — see FACETS at the bottom of the file.
const BASE_FACETS: readonly Facet[] = [
  {
    key: "channel",
    control: "checkbox",
    // Only the general /ads page offers this — a channel page's rows already
    // belong to one channel, so it would be a single always-checked box.
    channels: [],
    optionsScope: "rows",
    label: (ctx) => ctx.t("catalog.channel"),
    options: (rows) => {
      const present = new Set(rows.flatMap((r) => r.channels));
      return AD_CHANNELS.filter((c) => present.has(c.code)).map((c) => c.code);
    },
    optionLabel: (value, ctx) => ctx.t(`adChannel.${value}`),
    matches: (row, selected) => row.channels.some((c) => selected.includes(c)),
  },

  {
    key: "genre",
    control: "checkbox",
    channels: "ALL",
    label: (ctx) => ctx.t("catalog.genre"),
    // 5.6: every genre a project carries, not just genres[0] — a project
    // tagged Comedy+Drama surfaces under either filter.
    options: (rows) =>
      Array.from(
        new Set(
          rows.flatMap((r) =>
            r.kind === "PROJECT" ? (r.project.genres.length > 0 ? r.project.genres : [r.project.genre]) : [],
          ),
        ),
      ).sort(),
    optionLabel: (value, ctx) => ctx.localize("genre", value),
    matches: (row, selected) => {
      if (row.kind !== "PROJECT") return false;
      const gs = row.project.genres.length > 0 ? row.project.genres : [row.project.genre];
      return selected.some((s) => gs.includes(s));
    },
  },

  {
    key: "format",
    control: "checkbox",
    channels: "ALL",
    label: (ctx) => ctx.t("catalog.format"),
    // FORMAT_CATEGORY_VALUES order (editorial: Feature film → Series → …),
    // not alphabetical — see form-shared.ts. formatCategory can legitimately
    // be "" (deriveFormatCategory found no match); that only gets its own
    // opt-in checkbox when at least one row actually has it (5.8).
    options: (rows) => {
      const projects = rows.flatMap((r) => (r.kind === "PROJECT" ? [r.project] : []));
      const present = new Set(projects.map((p) => p.formatCategory).filter(Boolean));
      const ordered = FORMAT_CATEGORY_VALUES.filter((v) => present.has(v));
      return projects.some((p) => !p.formatCategory) ? [...ordered, ""] : ordered;
    },
    optionLabel: (value, ctx) =>
      value === "" ? ctx.t("catalog.formatUnspecified") : ctx.localize("formatCategory", value),
    // With no format filter active this facet isn't consulted at all (see
    // Facet.matches above) — "" only matches once the visitor explicitly
    // ticks the Unspecified bucket, so a blank row never disappears silently.
    matches: (row, selected) => row.kind === "PROJECT" && selected.includes(row.project.formatCategory),
  },

  {
    key: "platform",
    control: "checkbox",
    channels: "ALL",
    label: (ctx) => ctx.t("catalog.platform"),
    // QA-8: "Available on" mixes brand names (left as-is) with a few generic
    // category words, which do get a label — same split as genre/format.
    options: (rows) =>
      Array.from(
        new Set(rows.flatMap((r) => (r.kind === "PROJECT" ? parseStringArray(r.project.platforms) : []))),
      ).sort(),
    optionLabel: (value, ctx) => ctx.localize("platformCategory", value),
    matches: (row, selected) => {
      if (row.kind !== "PROJECT") return false;
      return selected.some((s) => parseStringArray(row.project.platforms).includes(s));
    },
  },

  {
    key: "country",
    control: "checkbox",
    channels: "ALL",
    // Removed as a control on 2026-07-27 (content review) — `hidden` keeps it
    // out of the rail while its state and matches() keep filtering, so an old
    // "?country=AM" link still narrows the results instead of being ignored.
    hidden: true,
    matches: (row, selected) => {
      if (row.kind !== "PROJECT") return false;
      return selected.some((s) => splitCountries(row.project.countries).includes(s));
    },
  },

  {
    key: "ptype",
    control: "checkbox",
    channels: "ALL",
    label: (ctx) => ctx.t("catalog.placementType"),
    // Same "only when the data has it" rule as platform — until creators
    // start classifying their placements this facet doesn't render at all.
    options: (rows) => {
      const present = new Set(rows.flatMap((r) => (r.kind === "PROJECT" ? r.project.placementTypes : [])));
      return PLACEMENT_TYPE_VALUES.filter((v) => present.has(v));
    },
    optionLabel: (value, ctx) => ctx.localize("placementType", value),
    matches: (row, selected) => row.kind === "PROJECT" && selected.some((s) => row.project.placementTypes.includes(s)),
  },

  {
    key: "city",
    control: "checkbox",
    channels: "ALL",
    label: (ctx) => ctx.t("catalog.city"),
    // The ad-space facet the rail carries (plan B3) — sizeFormat is free text
    // and reachPerDay wants a range slider the rail doesn't have. Merged
    // 2026-08-14 (stage 3) with an EVENTS project's eventCity rather than
    // giving it its own "City" header: a visitor asking "what's on in
    // Yerevan" doesn't care whether the answer is a billboard or a festival.
    // No shared canonicalization, though — AdSpace.city runs through
    // canonicalCityToken() on save (11.08 migration, see cities.ts),
    // eventCity doesn't, so a hand-typed non-canonical spelling shows up as
    // its own separate checkbox instead of merging into the canonical one.
    // localizeCity()'s raw-value fallback keeps it from ever rendering
    // blank either way; normalizing eventCity's write path the same way
    // AdSpace.city already was is a follow-up, not a facets.ts problem.
    options: (rows) =>
      Array.from(new Set(rows.map(cityFacetValue).filter(Boolean))).sort(),
    // QA-8: same split as genre/format — the checkbox reads in the visitor's
    // language, filtering still compares the raw city value.
    optionLabel: (value, ctx) => localizeCity(ctx.locale, value),
    matches: (row, selected) => {
      const city = cityFacetValue(row);
      return city !== "" && selected.includes(city);
    },
  },
];

/** A CatalogRow's attrs bag, whichever kind it is — the one thing every
 *  generated facet below needs and CatalogRow itself doesn't unify (a
 *  project's and a space's `attrs` live under different keys, same split as
 *  `project`/`space`). */
function attrsOf(row: CatalogRow): Record<string, unknown> {
  return row.kind === "PROJECT" ? row.project.attrs : row.space.attrs;
}

/** eventCategory is listed in AD_CHANNEL_ATTRS.EVENTS purely to document its
 *  closed value set and dictionary key for the form — the value itself lives
 *  on Project.eventCategory, a first-class column, never in the attrs JSON
 *  bag (see schema.prisma's comment on it). collectAttrDefs() below would
 *  only ever see it empty; excluded here and built as a real facet further
 *  down instead, reading the column it's actually stored in. */
const NON_ATTR_KEYS = new Set(["eventCategory"]);

/** Every AttrDef in AD_CHANNEL_ATTRS, keyed once even when more than one
 *  channel declares it under the same token — "language" (RADIO, TV, VIDEO)
 *  or "district" (BILLBOARD, LIFTS) is one facet with one dictionary entry,
 *  not a copy per channel. `channels` collects every code that carries it, so
 *  facetsFor() offers it on each of that key's own channel pages.
 *
 *  Two channels sharing a key don't always share its closed list —
 *  RADIO's "spotKind" is SPOT/SEGMENT_SPONSORSHIP/HOST_READ, TV's is
 *  SPOT/SHOW_SPONSORSHIP/TICKER — so `values` is the union across every
 *  channel that carries the key, not just the first one found; options()
 *  below still intersects that union with what a given page's rows actually
 *  have, so a TV page never offers RADIO's HOST_READ checkbox or vice versa. */
function collectAttrDefs(): { key: string; type: AttrDef["type"]; values?: string[]; isOpen: boolean; channels: string[] }[] {
  const byKey = new Map<
    string,
    { key: string; type: AttrDef["type"]; values?: string[]; isOpen: boolean; channels: string[] }
  >();
  for (const [channelCode, defs] of Object.entries(AD_CHANNEL_ATTRS)) {
    for (const def of defs) {
      if (NON_ATTR_KEYS.has(def.key)) continue;
      const entry = byKey.get(def.key);
      if (!entry) {
        byKey.set(def.key, {
          key: def.key,
          type: def.type,
          values: def.values ? [...def.values] : undefined,
          isOpen: isOpenList(def),
          channels: [channelCode],
        });
        continue;
      }
      entry.channels.push(channelCode);
      if (!entry.isOpen && def.values) {
        for (const v of def.values) if (!entry.values!.includes(v)) entry.values!.push(v);
      }
    }
  }
  return [...byKey.values()];
}

/** One checkbox facet per select/multiselect/boolean attribute in
 *  ad-channel-attrs.ts (2026-08-14, stage 3) — adding a tenth channel or a
 *  reworded attribute is a change to that file alone, same "one registry"
 *  point stage 2's header comment makes about the seven hand-written facets
 *  above.
 *
 *  Number attributes (entrances, subscribers, attendance, …) are skipped:
 *  every facet here renders through CheckboxFilter (see ads-view.tsx), and a
 *  checkbox per distinct number isn't a filter, it's a bug waiting to be
 *  filed. ponytail: wire a "range" control (the type already reserves the
 *  name) when a number attribute actually needs filtering rather than just
 *  showing on the card/detail page. */
const ATTR_FACETS: readonly Facet[] = collectAttrDefs()
  .filter((g) => g.type !== "number")
  .map((g): Facet => {
    if (g.type === "boolean") {
      // A boolean only ever needs one checkbox ("Illuminated"), not two
      // ("Illuminated" / "Not illuminated") — "false" is the same as absent
      // everywhere else this bag is read (normalizeAttrs, the form), so the
      // facet stays consistent by only ever offering the "on" state.
      return {
        key: g.key,
        control: "checkbox",
        channels: g.channels,
        label: (ctx) => ctx.t(attrLabelKey(g.key)),
        options: (rows) => (rows.some((r) => attrsOf(r)[g.key] === true) ? ["true"] : []),
        optionLabel: (_value, ctx) => ctx.t(attrLabelKey(g.key)),
        matches: (row, selected) => selected.includes("true") && attrsOf(row)[g.key] === true,
      };
    }
    if (g.type === "multiselect") {
      return {
        key: g.key,
        control: "checkbox",
        channels: g.channels,
        label: (ctx) => ctx.t(attrLabelKey(g.key)),
        options: (rows) => {
          const present = new Set<string>();
          for (const r of rows) {
            const v = attrsOf(r)[g.key];
            if (Array.isArray(v)) for (const x of v) present.add(String(x));
          }
          // Closed list: only the values actually present, in the directory's
          // own order (union across channels — see collectAttrDefs) — same
          // "no data, no checkbox" rule as every hand-written facet above.
          // Open list (none today, but the directory allows one): whatever
          // turned up, alphabetised.
          return g.isOpen ? [...present].sort() : (g.values ?? []).filter((v) => present.has(v));
        },
        optionLabel: (value, ctx) => (g.isOpen ? value : ctx.t(attrValueLabelKey(g.key, value))),
        matches: (row, selected) => {
          const v = attrsOf(row)[g.key];
          return Array.isArray(v) && selected.some((s) => v.includes(s));
        },
      };
    }
    // "select"
    return {
      key: g.key,
      control: "checkbox",
      channels: g.channels,
      label: (ctx) => ctx.t(attrLabelKey(g.key)),
      options: (rows) => {
        const present = new Set<string>();
        for (const r of rows) {
          const v = attrsOf(r)[g.key];
          if (typeof v === "string" && v) present.add(v);
        }
        // Open list (district, route — see isOpenList): the checkboxes ARE
        // the data, alphabetised; nothing here maintains an Armenian gazetteer.
        return g.isOpen ? [...present].sort() : (g.values ?? []).filter((v) => present.has(v));
      },
      optionLabel: (value, ctx) => (g.isOpen ? value : ctx.t(attrValueLabelKey(g.key, value))),
      matches: (row, selected) => {
        const v = attrsOf(row)[g.key];
        return typeof v === "string" && selected.includes(v);
      },
    };
  });

/** EVENTS-only facets over Project's first-class columns (2026-08-14) — not
 *  attrs, so not generated by ATTR_FACETS above. */
const EVENT_CATEGORY_VALUES = AD_CHANNEL_ATTRS.EVENTS.find((d) => d.key === "eventCategory")?.values ?? [];

const EVENT_FACETS: readonly Facet[] = [
  {
    key: "eventCategory",
    control: "checkbox",
    channels: ["EVENTS"],
    label: (ctx) => ctx.t(attrLabelKey("eventCategory")),
    options: (rows) => {
      const present = new Set(rows.flatMap((r) => (r.kind === "PROJECT" && r.project.eventCategory ? [r.project.eventCategory] : [])));
      return EVENT_CATEGORY_VALUES.filter((v) => present.has(v));
    },
    optionLabel: (value, ctx) => ctx.t(attrValueLabelKey("eventCategory", value)),
    matches: (row, selected) => row.kind === "PROJECT" && selected.includes(row.project.eventCategory),
  },
  {
    // ponytail: no date-range control exists yet (same reason the number
    // attrs above skip a "range" one) — wire options()/matches() and an
    // actual date-range picker in ads-view.tsx when this needs filtering
    // rather than just sorting/display. Kept in the registry so the URL/
    // state plumbing (ads-url-state.ts) already has a slot reserved.
    key: "eventDate",
    control: "dateRange",
    channels: ["EVENTS"],
    matches: () => false,
  },
];

export const FACETS: readonly Facet[] = [...BASE_FACETS, ...ATTR_FACETS, ...EVENT_FACETS];

/** Every facet key, in registry order — ads-url-state.ts uses this so a new
 *  facet's query param is picked up without a second list to keep in sync. */
export const FACET_KEYS: readonly string[] = FACETS.map((f) => f.key);

/** Without a channel code: the general /ads page, every facet. With one: the
 *  facets that apply everywhere plus the ones scoped to that channel — used
 *  by /ads/[channel] (stage 3 fills ATTR_FACETS above in, so a channel page
 *  now offers its own attributes alongside the shared ones). */
export function facetsFor(channelCode?: string): readonly Facet[] {
  if (!channelCode) return FACETS;
  return FACETS.filter((f) => f.channels === "ALL" || f.channels.includes(channelCode));
}
