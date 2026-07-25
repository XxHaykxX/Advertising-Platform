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
(exact shape confirmed with user). DONE + deployed (2026-07-25).

## Status of Parts A/B/C
DONE + DEPLOYED 2026-07-25 (prod HEAD 2860140, then 2c076bb). Cast pick-only,
prod Person seed, cast dropdown un-clip, orphan-column drops (12 cols on prod),
Production Info merge/wording all live.

## Part D — Video: variant A (self-hosted MP4 player) + one-source rule (DONE, not yet deployed at spec-write; shipped in this batch)
User decision 2026-07-25 (build after next compact; do NOT deploy until told):
- A project has exactly ONE video source: either an embed link OR an uploaded
  MP4 — never both.
- Admin (Design section): a TAB switcher "Video link (embed) | Upload MP4".
  Render only the active tab's field; the inactive field is absent from the
  form so the server nulls that column on save (enforces one source). Default
  tab on edit: upload if videoFile set, else embed.
- Report player: new client `<VideoPlayer>` for the MP4 source — custom controls
  (center + bottom-bar play/pause, seek progress, current/duration time,
  mute/volume, fullscreen), site-themed, auto-hide while playing, space toggles,
  respects prefers-reduced-motion, NO branding. poster-slider.tsx uses it for
  the file source; the embed source stays an iframe (chrome already stripped via
  toEmbedUrl → youtube-nocookie + controls=0/rel=0/modestbranding, shipped
  2c076bb). YouTube logo can't be fully removed on an embed — MP4 is the only
  brand-free path.
- i18n keys to add: projectForm.video.tabEmbed, projectForm.video.tabUpload.
- No DB migration (videoEmbedUrl / videoFile columns already exist).

## Part E — Remove Status column from /admin/projects list (DONE)
reorder-list.tsx: dropped the `<th>Status</th>` header + the `<StatusPill>` cell in
BOTH tables (SUPERADMIN + PUBLISHER views), removed the now-dead `StatusPill`
component + `STATUS_PILL` map, adjusted empty-state colSpans (7→6, 5→4). Status
filter dropdown kept (`STATUS_LABEL` still used). Cosmetic, no DB.

## Parts D/E status
DONE + DEPLOYED 2026-07-25. Additive code only (video columns videoEmbedUrl/
videoFile already existed; Status removal is UI-only) — no DB migration. tsc 0,
vitest 62/62, prod build green. New file `src/components/report/video-player.tsx`
(custom HTML5 MP4 player: center + bottom-bar play/pause, seek drag+click,
time, mute, fullscreen, auto-hide 2.5s while playing, keyboard space/k/f/m/±5s,
prefers-reduced-motion). poster-slider.tsx uses it for the file source; the embed
source stays a chrome-stripped iframe. project-form.tsx tab switcher renders
exactly one source field (the inactive one unmounts → server nulls that column).
