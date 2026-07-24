# Admin Panel Redesign — Proposal (2026-07-24)

Status: **PROPOSAL — no code changed.** For user approval before implementation.
Scope: `src/app/admin/(panel)/` — shell/nav, project form, Cast & Crew editor, projects list, media library.

---

## 1. Audit — what's wrong today

### 1.1 Cast & Crew editor wastes ~4x the vertical space it needs
`projects/actors-editor.tsx` renders **one bordered card per person** (`rounded-xl border bg-section p-4`, `space-y-4` between cards). Each card is two stacked blocks:
- Row 1: Name / Role / Kind — three full-width labeled inputs (`sm:grid-cols-3`).
- Row 2: a full "Photo" sub-block — label + Browse button + size-hint line + thumbnail below.

Cost per person: **~180–220px of height**. A serial with 15 cast members ≈ **3000px of scrolling** inside one section of an already long form. The photo block is the main offender: the size-hint paragraph and stacked Browse button occupy a whole row for what is functionally a 40px avatar.

Other issues in the same file:
- New rows **append to the bottom** (`[...value, EMPTY_ACTOR]`) — after adding, you scroll down past every existing card to type (user backlog #8 asks for prepend).
- No reorder. Cast display order on the public page = row order, but the only way to reorder is delete/re-add.
- Mini-labels ("Name", "Role", "Kind") repeat on **every** card — pure noise after the first row.

### 1.2 Project form is one giant single-column scroll
`projects/project-form.tsx` — 8 stacked `section` cards (General, Translations, Status, Placement, Audience, Press-kit, Cast, Tiers, Visibility), `max-w-5xl`, `space-y-8`, each `p-6`. Problems:
- **No in-page navigation.** To fix one field in "Audience & value" you scroll blind through ~5 screens. Section headers are visually identical (same small uppercase primary text), so there's no scanning anchor.
- **Save is at the very bottom.** Editing the poster (top) then finding Submit means a full-page scroll; there's no sticky action bar, no dirty indicator.
- Fields are generously padded (`space-y-4` + `gap-4` + `p-6` + `rounded-2xl`) — right for a marketing page, loose for a work tool. Roughly 40% of each screenful is whitespace/borders.
- Related pairs are sometimes not paired: e.g. `priceMinAmd`/`priceMaxAmd` are a 2-col grid (good) but Status section holds only 2 fields in a whole card; Audience holds 3; Press-kit holds 2. Five near-empty cards each pay full card overhead.

### 1.3 Shell wastes horizontal space
`admin-shell.tsx` — content area is `p-4 … md:p-10` and the form itself is `max-w-5xl`. On a 1920px screen: 240px sidebar + 80px padding + 1024px form = **~570px of dead space** on the right. User backlog #6 ("wider admin working area") confirms this hurts.

### 1.4 Projects list is fine structurally, thin functionally
`projects/page.tsx` + `reorder-list.tsx` — the dnd table is good (recently rebuilt on @dnd-kit). Missing: **search/filter** (any catalog >15 rows needs title filter + status/active filters), row density is `py-3` with 40px posters (fine), and there's no quick "open public page" link. Status is plain text — no color coding, so you can't scan for "what's still Pre-production".

### 1.5 Media library: no search, serial uploads, chunky cards
`media/media-manager.tsx` — folder home + grid is a sound model. Concrete gaps:
- **No filename search** — finding one file among 200 means eyeballing thumbnails.
- Upload is button-only and **sequential** (`for … await uploadImage`) — no drag-drop onto the grid (user backlog #15), no parallelism.
- Each tile spends ~70px below the thumbnail on a truncated path + size + two icon buttons — at 4 columns that's a lot of chrome per image. Path-copy is a power feature that could live in the lightbox/hover instead.
- No "which project uses this?" info, even though the server already knows (delete refuses when referenced).

### 1.6 Nav/dashboard nits
`admin-nav.tsx` is clean, but: 9 flat items with no grouping (Content vs Platform vs Comms); badge fetch is per-route-change (fine); no collapsed/icon-only mode to reclaim the 240px on smaller laptops.

---

## 2. Reference research — patterns worth stealing

Studied against: YouTube Studio, Shopify Admin, Sanity Studio, Contentful, Linear, Notion databases.

1. **Table-style inline row editors** (Contentful references field, Notion database rows, Shopify variants table). Repeating records render as a *table*: one header row of labels, then borderless input rows ~44–48px tall. Inputs look like plain text until focused (border appears on focus). This is the single biggest density win — Shopify fits 10 product variants in the space our editor spends on 2 people.
2. **Sticky section rail + sticky action bar** (Shopify, Sanity). Long edit forms get a slim right/left rail of anchor links with scroll-spy, and a top bar that pins "Save / Discard" with a dirty-state indicator ("Unsaved changes"). Shopify's contextual save bar is the gold standard: appears only when dirty, always reachable.
3. **Two-column form layout: main + sidebar meta** (Shopify product page, YouTube Studio video details). Primary content (title, description, media) in a wide left column; publish state, visibility, categorization, pricing in a narrow right column of small cards. Cuts page height ~40% and puts "settings-ish" fields where the eye expects them.
4. **Drawer/panel editors for secondary records** (Linear issue panel, Sanity array item dialog). The rare *rich* edit (e.g. a cast member's photo crop) opens in a right-side drawer over the form instead of inflating every row to worst-case height. Rows stay one-line; depth is on demand.
5. **Command-K + list filtering as the primary nav** (Linear). Every list gets an always-focused filter input; power users never touch pagination. Cheap to add (client-side filter over already-loaded rows) and transforms lists >20 items.

Anti-pattern to avoid (seen in Contentful's weaker spots): collapsible sections that default-collapsed — they hide validation errors and make "did I fill everything?" impossible. Prefer *anchored* sections over *collapsed* ones.

---

## 3. Recommendations mapped to this admin

### 3.1 ⭐ Cast & Crew → compact table editor (priority #1)

One header row, then one **48px row per person**. Photo becomes a 36px avatar chip that opens the MediaPicker on click. Drag handle for reorder (reuse the @dnd-kit setup from `reorder-list.tsx`). New rows **prepend** and autofocus the Name input.

```
Cast & crew (14)                                [⊕ Add person]
┌──────────────────────────────────────────────────────────────┐
│    PHOTO  NAME                ROLE              KIND         │
│ ≡  (◯)   [Արամ Ղազարյան   ] [Գլխավոր դեր   ] [Cast ▾]  ✕   │
│ ≡  (◯)   [Անի Պետրոսյան   ] [Ռեժիսոր        ] [Crew ▾]  ✕   │
│ ≡  ( + )  [                 ] [               ] [Cast ▾]  ✕   │
└──────────────────────────────────────────────────────────────┘
```

- Layout: CSS grid `grid-cols-[24px_40px_1fr_1fr_110px_32px] items-center gap-2`, rows `py-1.5`, divided by `divide-y divide-border` — **no per-row card, no per-row labels**.
- Inputs: borderless until focus — `bg-transparent border border-transparent focus:border-primary focus:bg-card rounded-lg px-2 py-1.5 text-sm`. Reads as a table, edits like a form.
- Photo chip: `h-9 w-9 rounded-full overflow-hidden` showing the image or a `+` placeholder; click opens the existing `MediaPicker` directly (skip the ImageUploader wrapper — its Browse-button+hint layout is what bloats rows today). Hover shows a small ✕ to clear.
- Kind: keep a compact `<select>`; Cast/Crew as a 2-option select at `w-[110px]` beats radio pills for width.
- Keep the `datalist` autocomplete + known-person autofill exactly as-is (it operates on the input, not the layout).
- Mobile (<sm): rows wrap to a 2-line stack (photo+name / role+kind) — still far tighter than today's card.
- **Result: 15 people ≈ 750px instead of ~3000px.**

Data contract unchanged: still `ActorRow[]` → parent state → hidden `actorsRows` JSON input. Reorder just permutes the array; server already persists array order as sortOrder.

Apply the same table treatment to `tiers-editor.tsx` (name | price | benefits-summary per row; benefits textarea can expand inline on focus or open in a small popover).

### 3.2 Project form → two-column + sticky chrome

```
┌ Sticky top bar ──────────────────────────────────────────────┐
│ ← Projects   «Արամ» · editing        [Unsaved •] [Cancel][Save]│
├──────────────┬───────────────────────────────┬───────────────┤
│ Section rail │  MAIN (≈2/3)                  │ SIDE (≈1/3)   │
│ • General    │  General (title/kind/genre)   │ Visibility     │
│ • Translat.  │  Translations (hy/ru/en tabs) │ Status/Release │
│ • Media      │  Poster + Gallery             │ Audience       │
│ • Cast&Crew  │  Cast & crew table (3.1)      │ Pricing        │
│ • Tiers      │  Tiers table                  │ Press-kit      │
└──────────────┴───────────────────────────────┴───────────────┘
```

- **Sticky action bar**: `sticky top-0 z-20 -mx-* border-b bg-card/95 backdrop-blur px-4 py-2.5 flex items-center gap-3`. Submit button moves here (it can stay a plain `<button form=…>`/submit inside the same `<form>` — the form element wraps the whole page). Dirty flag: flip a boolean in the existing `onInput={scheduleSaveDraft}` handler — the wiring is already there.
- **Layout**: `grid lg:grid-cols-[1fr_320px] gap-6` inside the form; drop `max-w-5xl` → `max-w-none xl:max-w-[1400px]` (fixes backlog #6 together with `md:p-10` → `md:px-6 md:py-6` in `admin-shell.tsx`).
- **Section rail** (xl+ only): slim anchor list, `sticky top-14`, scroll-spy via IntersectionObserver; on smaller screens it's simply absent (sections still flow).
- **Translations as tabs** (ՀՅ / РУ / EN) instead of 3-wide grids ×3 field types: one visible column per language, all three inputs stay mounted (`hidden` class on inactive tabs) so refs, Translate-button writes, FormData capture, and draft autosave all keep working untouched. Cuts the section's height to a third and mirrors YouTube Studio's localization UI.
- **Density pass**: sections become `p-4 space-y-3`, field label `text-xs`, inputs `py-1.5`, section gap `space-y-4`. Cards keep `rounded-xl border bg-card` — same tokens, tighter numbers.

### 3.3 Shell & nav

- Grouped nav with tiny group headers (`text-[10px] uppercase tracking-wider text-muted-foreground px-3 pt-4 pb-1`):
  `CONTENT` Projects · Media · Moderation | `PLATFORM` Portfolio · Partners · Users | `COMMS` Broadcast · Notifications. Dashboard stays top-level. Pure re-grouping of the existing `NAV` array — role gating (`show:`) untouched.
- Optional collapsed mode: `w-60 → w-14` toggle persisted in localStorage; icons + tooltips. Nice-to-have, not phase 1.
- Content padding `md:p-10 → md:px-6 md:py-5` and remove page-level `max-w` constraints on list pages.

### 3.4 Projects list

```
Projects (23)          [Search title… 🔍] [Status ▾] [Active ▾]   [⊕ New]
┌──┬────────┬─────────────────┬────────────┬────────┬─────────┬───┐
│≡ │ poster │ Title           │ ●Filming   │ [on ]  │ owner   │ ⋮ │
```

- Add a client-side **filter row** above the table (title substring + status select + active select) — filters the already-loaded `rows` state in `reorder-list.tsx`; dnd reorder simply disables while a filter is active (order is global, can't reorder a filtered subset).
- **Status pills**: colored dot + label — `PRE_PRODUCTION` muted, `FILMING` warn, `POST_PRODUCTION` primary, `RELEASED` success. Tokens already exist (`--warn`, `--success`).
- Collapse the trailing Delete into a `⋮` menu (Edit / View public page / Delete) — frees a column and adds the missing public-page link.
- Row `py-3 → py-2`.

### 3.5 Media library

- **Search input** in the folder-view header — filters `visible` by path substring. 5-line change, huge payoff.
- **Drag-drop upload**: dropzone over the grid (`onDragOver`/`onDrop` on the wrapper, ring highlight `ring-2 ring-primary/40` while hovering) feeding the same `onPickFiles` pipeline; fire uploads with `Promise.all` batches of 3 instead of strictly serial. (= backlog #15.)
- **Slimmer tiles**: thumbnail + one overlay row on hover (size · copy · delete), path only in the lightbox. Tile chrome drops from ~70px to 0; grid goes to `lg:grid-cols-6`.
- Lightbox gains a "Used in: «Title»" line later (server already tracks references for delete-protection — expose it read-only). Phase 3.

---

## 4. Phased plan

**Phase 1 — cosmetic/low-risk (no data-flow changes):**
density pass on form sections & inputs; wider shell (`max-w`, padding); grouped nav; status pills + row density in projects list; media search input; slimmer media tiles.

**Phase 2 — structural but contained:**
Cast & Crew table editor (3.1) + prepend + dnd reorder; same for Tiers; sticky action bar with dirty state; media drag-drop upload.

**Phase 3 — layout re-architecture:**
two-column form + section rail + translation tabs; ⋮ row menus; collapsed sidebar; "used in" on media.

### Don't-break list (hard constraints)
- **Hidden-input mirrors**: `actorsRows`/`tiersRows` JSON inputs, MultiSelect/ImageUploader hidden fields, and the FormData-snapshot **draft autosave** (`DRAFT_KEY`, `CONTROLLED_NAMES`) all read the live `<form>` — every field must remain inside the single form element, keep its `name`, and controlled widgets must keep mirroring. Translation *tabs* must keep inactive inputs mounted (CSS-hidden, not unmounted) or Translate-refs + drafts break.
- **Actor order = sortOrder** on the public page; prepend/reorder changes array order deliberately — that's the feature, but the server action mapping index→sortOrder must stay as-is.
- **Known-people autofill** (`updateName` + shared `datalist`) and the ImageUploader remount-on-autofill trick (`key={r.photo}`) — the table editor replaces the uploader with a MediaPicker chip, so re-verify autofilled photos render.
- **Server actions untouched**: `createProject/updateProject`, `reorderProjects`, `uploadImage/deleteUpload` keep their signatures. This is a client-layout redesign.
- **mode="creator" reuse**: `ProjectForm` is shared with the creator cabinet — every change ships to `/account/projects/new` too. Two-column + sticky bar must degrade gracefully there (or be gated by `mode` if the creator side should stay simple).
- Admin chrome stays **English**; creator mode stays locale-aware (`t` plumbing unchanged).
- Publisher/non-superadmin plain table in `projects/page.tsx` needs the same list upgrades as the dnd table.

---

## 5. Top 5 quick wins (approvable today)

1. **Cast & Crew table editor** — 4x denser, header-row labels, avatar chip, prepend + drag reorder. The headline change.
2. **Sticky Save bar** with "Unsaved changes" dot — no more scrolling to the bottom to save.
3. **Wider admin**: drop `max-w-5xl`, shrink `md:p-10` — reclaims ~500px on desktop (= backlog #6).
4. **Projects list filter + status pills** — search-as-you-type + color-coded status.
5. **Media: search box + drag-drop multi-upload** (= backlog #15).
