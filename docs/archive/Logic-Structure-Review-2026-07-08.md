# iGovazd — Logic & Structure Review (2026-07-08)

Read-only review of the `placement/` app across 4 layers (UX/flow, data model & business
rules, code architecture, content & i18n) by 4 parallel reviewer agents. Findings only —
no fixes applied in this pass. Ranked by severity.

Legend: ✂️ = resolved by the in-progress "remove brand safety" work · ✍️ = an intentional
change made earlier this session (flagged for awareness).

---

## HIGH

### 1. "Anonymity until mutual interest" is falsified on the page that advertises it
Catalog banner (`i18n.ts` `catalog.anonymizedNotice`, rendered `catalog-view.tsx:304`),
FAQ q3 (`i18n.ts:288`) and a `Lock` icon + `express.lockedNotice` (`roi-snapshot.tsx:24-26`)
all promise production/brand identities stay hidden until mutual interest. But the ungated
report reveals to any anonymous visitor: real **title** and **studio** (`report-hero.tsx:79,45`),
full **cast** with real names (`cast.tsx:36-56`), gallery stills, exposure totals, per-scene
opportunities. Seed confirms real identities (`seed-data.ts:74,87`). There is **no
"mutual interest" state in the data model** and nothing is gated — the Lock is decorative.
The product's central trust promise is contradicted. Reputational/legal risk.
→ Either genuinely gate identity fields (mask title/studio/cast/gallery behind an accepted
application, show only code/genre/audience/ROI) so the lock means something, or remove the
anonymity claims from copy + Lock iconography.

### 2. Three-language content mix on every page
Default locale is **hy**, but DB content is single-language and rendered raw:
- Titles are **Russian** — "Фул Хаус։ Посадка", "Святой 3"… (`seed-data.ts:74,164,254,332,422,499`;
  rendered `project-card.tsx:66`, `catalog-view.tsx:75`, `report-hero.tsx:79`).
- Synopses are **English** (`seed-data.ts:76,166,…`).
- Genres are Latin English AND double as filter labels in the Armenian sidebar
  (`catalog-view.tsx:319-328`, options from `p.genre` at `:176-179`) — unlike `status`/`gender`
  which are localized.
- Scene content + enums (`opp.type`="visual", `opp.prominence`="active") English
  (`opportunity-item.tsx:18-32`).
Root cause is architectural: no translation columns/table (acknowledged TODO `i18n.ts:5-6`).
→ Add per-locale content (columns or a Content table) + dict maps for closed enums
(genre, placementType, type/prominence, product categories).

### 3. Two divergent Application-creation paths; lead form unprotected
`submitApplication` (apply dialog, `src/lib/actions/applications.ts:88`) has
honeypot/consent/rate-limit/phone; `submitLead` (contact form, `src/lib/actions/leads.ts:43`)
has **none**. Same entity, diverging rules — lead validation is trivially bypassed, contact
form is open to spam, schema changes must be made twice.
→ Collapse both onto one `createApplication` (data layer) with shared validation.

### 4. Placeholder phone shipped as production contact
`+374 00 000 000` + `tel:+37400000000` / `wa.me/37400000000` in footer of every page and the
contact page (`footer.tsx:10,12`, `contact-page/contact-methods.tsx:14,26`, `header.tsx:25,27`).
→ Real number or hide phone/WhatsApp until one exists.

### 5. admin/applications: N+1 + DTO boundary breach
`applications/page.tsx:55` imports `prisma` and runs a second `findMany` only to get `phone`
(absent from `ApplicationDTO`).
→ Add `phone` to `ApplicationDTO`/`listApplications`; drop direct prisma from the page.

---

## MED

### 6. Dead CTA buttons on the report
"Download PDF" and "Share" (`report-hero.tsx:66-73`, `investment.tsx:113-120`) are
`<Button>` with no `onClick`/`href`/binding — inert on the primary conversion page (each offered twice).
→ Wire them or remove.

### 7. Slots are decorative; no invariant
No `slotsTaken <= slotsTotal` check (`projects/actions.ts:130-131`, both only clamp ≥0);
admin can set taken>total → `project-card.tsx:34` shows "0 slots" with a full bar. Neither
`submitApplication` nor `submitLead` ever update `slotsTaken` — applying never moves the counter.
→ Validate taken≤total; wire slots to accepted applications, or drop the counter.

### 8. `Application.projectId` has no FK/relation
Nullable Int, client hidden-field value written as-is (existence unchecked); on project delete
the application orphans, joins impossible (`schema.prisma:172`, `leads.ts:47`/`applications.ts:95`).
Denormalized `projectTitle` snapshot masks it, but `projectId` is a dangling/forgeable ref.
→ Relation with `onDelete: SetNull`, or existence check.

### 9. Budget filter effectively unusable
Compares raw input against parsed full-dollar values (`catalog-view.tsx:239-256`); "150" finds
nothing, no units shown in the UI.
→ Normalize units / add hint.

### 10. Dead `Setting`/default_lang model
seed writes `"en"` (`seed.ts:70`), `getLocale` reads only the cookie and falls back to the
`DEFAULT_LOCALE="hy"` constant (`locale.ts:8`) — the Setting is never read/written by the app (+ en↔hy drift).
→ Wire Setting reads or delete the model.

### 11. Placeholder accordions presented as report sections
`deep-dive.tsx:164-172`: "Value Alignment" expands to a bare `<ExpressInterestBanner>`;
"Psychographics" (`:152-162`) expands to `deepDive.noData`.
→ Populate or remove from the accordion list.

### 12. Three divergent "contact / express interest" destinations
`/contact` page (hero/get-started/nav/footer), `/#contact` homepage anchor (login/register
"Express Interest"), and the in-place `ApplyDialog` modal (card/report) — no consistent rule.
→ Pick one canonical lead surface.

### 13. Currency/number formatting hardcoded en-US
`format.ts:19-21` `moneyShort` uses `toLocaleString("en-US")` regardless of locale (used in
`opportunity-item.tsx:38`, `roi-snapshot.tsx:77`, `deep-dive.tsx:125`); seed figures are
en-grouped ("$150,000 — $300,000", "420K"). Dates, by contrast, ARE correctly localized
(`format.ts:32-69`).
→ Localize number/currency via `intlLocale`.

### 14. Entire i18n dict ships to the client bundle
`UI` (686 lines, all locales + admin/legal keys) imported into client components
(`header.tsx`, `catalog-view.tsx` pull `UI`/`makeUI`) → whole dict in the client bundle.
→ Split by namespace or send only the needed slice to the client.

### 15. ✂️ safety score ↔ label can diverge
`safety` (SAFE/REVIEW/RISK) and `safetyScore` (0-100) set independently by admin (score 92 +
label RISK possible); filter uses score, badge uses enum. *(Being removed.)*

---

## LOW

- **✍️ Mislabeled CTAs:** `btn.viewReport` = "Learn More"/"Подробнее" links to the full **report**
  (undersells it); `btn.requestDetails` = "Contact us"/"Связаться" opens a dialog titled
  "Request Details" (`apply-dialog.tsx:161`) — label ≠ dialog title. *(These labels were changed
  this session; the dialog-title mismatch is worth aligning.)*
- **ROI section has no tab** (`report-tabs.tsx:8-14` lacks `roi`; `roi-snapshot.tsx:65` id="roi") —
  unreachable via nav, active-tab highlight goes stale scrolling past it.
- **Dead columns:** `Application.note` in DTO but never written/rendered; `Application.budget`
  rendered (`applications/page.tsx:118`) but no live form writes it → always null.
- **`RECOMMENDED_FOR`/`USE_CAUTION_WITH`** (`deep-dive.tsx:17-18`) — static English lists,
  identical for every project (fake, non-data-driven).
- **`keyFacts.onRequest`** is translated but dead — `priceNote` is always non-null
  ("Price on request"), so the localized fallback never fires; price is always English.
- **RELEASED projects** still show slots + Apply, future deadline while "released"
  (`seed-data.ts:435`); status/deadline never gate applications.
- **Empty `opportunity.category` ("")** leaks into `productCategories` → empty filter checkbox
  (`projects/actions.ts:350`, `projects.ts:29,86`).
- **`/login` & `/register`** live via direct URL (half-wired brand auth), dead-ends; unused dict
  keys `nav.signIn`/`nav.register`/`catalog.register`.
- **✂️ Empty `aiText`** seeded → risk list renders "Category: " with nothing (`seed.ts:36`).
- **Duplication:** ✂️`safetyTier` reinvented ×6; ✂️`STATUS/SAFETY_OPTIONS` vs `*_VALUES`;
  3 lead forms duplicate field/label classes + success screen; `sumExposure` dead export
  (`format.ts:23`).
- **Title glyph inconsistency:** "Фул Хаус**։**" (Armenian full stop, `seed-data.ts:74`) vs
  "Фул Хаус**:**" (colon, `:614`).
- **Static English micro-strings** bypass i18n: `Safety: x/100` tooltip, `"s"` duration suffix,
  `"Q2 2026"` hardcoded analysis date (`deep-dive.tsx:198`), "Storyboard" alt.

---

## Checked and OK (no action)
- All nav/footer routes resolve (`/catalog`, `/portfolio`, `/partners`, `/contact`,
  `/how-it-works`, `/terms`, `/privacy`, `/#faq`, `/#about`, `#stats`) — no dead links/orphans.
- Catalog empty state handled; "Clear all" disables correctly with no filters.
- Report missing-data degrades gracefully (gallery placeholders, cast tab hidden when no actors,
  optional facts guarded).
- DTO mapping uses `server-only`; RSC props serializable; **dates correctly localized**;
  Next 16 `proxy.ts` middleware convention correct.

---

## Next
Return here for recommendations + prioritization questions → plan → implement.
(Findings marked ✂️ will be closed by the concurrent brand-safety removal.)
