# Admin project form — field cleanup & clearer wording

Date: 2026-07-25 · Status: **approved (Production Info part), analysis pending (other columns)**

## Goal
Make the admin project form self-explanatory and remove duplicate / orphaned
fields. Deploy stays on HOLD; schema changes avoided where possible (data-only
migrations preferred). Admin chrome renders in English; ru/hy go in i18n.

## Part A — Production Info (APPROVED)

Research-informed labels + helper microcopy (helper only on ambiguous fields,
per NN/g / Shopify Polaris; obvious fields carry no helper).

| Old | New label | Helper |
|---|---|---|
| Status | **Production stage** | "Where the film is in its lifecycle. Powers the catalog filter; a brand can only join while Pre-production / Filming." |
| Release date | **Release date** | — |
| Expected release date | **REMOVED** | — |
| Application deadline | **Placement deadline** | "Last date a brand can apply — after this the shoot/edit is locked." |
| Platforms + Streaming source | **Available on** (merged, one field) | "Streaming / online platforms where the film is watchable. Shown to brands + catalog filter." |
| Cinemas / exhibition venues | **Cinema release** | — |
| Placement type | **Placement type** | "How the brand's product appears on screen." |
| — In-Frame | **On-screen (In-frame)** | |
| — Story Integration | **Story integration** | |
| — Mention | **Verbal mention** | |

### Mechanics (no table-schema migration)
- **Expected release date**: remove from UI. No public reader. Column kept in
  schema (deprecated); stops being written.
- **Available on**: merge onto the `platforms` column (keeps public Key Facts +
  catalog Platforms filter intact). Attach the global StreamingSource dictionary
  UX (options + allowCustom + delete) to it; drop the separate Streaming source
  field. Data migration (local + prod): for each project merge `streamingSource`
  values into `platforms`; seed the dictionary from distinct `platforms` values.
  `streamingSource` column kept but unused.
- **Status**: kept (drives catalog filter). Label + helper only.
- Public display labels "Platforms" → "Available on" for consistency.

## Part B — Other columns (ANALYSIS — decision pending)

**Orphan fields**: shown / filtered publicly but NOT editable in the form (were
removed in Ф1 as "non-CSV"). Frozen or empty; `projViews` / `subgenre` /
`releaseLabel` are additionally BLANKED on every save (not hidden-preserved).

1. Projected views (`projViews`) — card, report hero, ROI, catalog "sort by views".
2. Budget (`budgetMinAmd/Max` → budgetDisplay) — card, hero, catalog Budget filter+sort. Also: we now enter `boxOfficeAmd` (box office) but the OLD budget is what's displayed — mismatch.
3. CPM (`cpmMinAmd/Max`) — hero + ROI.
4. Audience gender/age — card, hero, catalog Gender + Age filters.
5. Price (`priceMinAmd/Max`, `priceNote`) — card, Key Facts "on request". (Pricing now lives in Placements/tiers.)
6. Subgenre, releaseLabel — report hero.

**Recommendation**: remove their public displays + the catalog filters/sorts
that depend on them + the columns. Cleans card / hero / ROI / catalog / schema
and fixes the silent blank-on-save bug. Exception: surface `boxOfficeAmd` (box
office) where the old budget used to show.

Exact per-group scope confirmed with the user before implementation.

## Part C — Production Timeline milestone fields
Simplify the milestone row per user: name + date + one free custom-text input
(exact shape confirmed with user).
