# Session Progress — 2026-07-08 (placement/)

Long working session on the iGovazd marketplace (`placement/`, Next.js 16, Prisma/MySQL,
dev port 3001, default locale hy). Terminology: **витрина** = public site, **админка** = /admin.
Snapshot for continuation after /compact.

## DONE & verified

1. **Catalog search** matches localized status in all 3 langs (hy/ru/en).
2. **"Clear all" button** restyled 1:1 with header primary button.
3. **Copy**: `btn.viewReport` → "Подробнее/Learn More/Մանրамасն"; `btn.requestDetails` → "Связаться/Contact us/Կապվել".
4. **Remember-me** on `/admin/login` (30d cookie + email prefill).
5. **Gallery field** added to admin project form (per-locale-agnostic, storyboard).
6. **Admin QA** — full CRUD verified; docs/Admin-QA-Report-2026-07-08.md.
7. **Bug fixed**: `projects/actions.ts` exported non-async from "use server" → whole /admin 500'd. Fix: `projects/form-shared.ts`.
8. **Bug fixed**: `next/image` remote URLs 500'd/hung report page → `next.config.ts` `images: { unoptimized: true }`.
9. **Responsive**: admin sidebar → drawer on mobile (`admin-shell.tsx`); header moved md→lg breakpoint + contact icons xl-only (Armenian overflow). Verified 375/768/1024/1440.
10. **Logic/Structure review** (4 agents) → docs/Logic-Structure-Review-2026-07-08.md (anonymity-fake, mixed-lang content, decorative slots, dup lead paths, etc.).
11. **Brand-safety FULLY REMOVED** — UI + admin + DB (prisma db push --accept-data-loss dropped safetyScore/safety/SafetyCategory/opportunity.safety). Marketing copy also removed (trust stat, faq.q2, investment.item2, hero/how-it-works/meta/terms/json-ld phrases).
12. **Hero bottom white gradient overlay** removed (`hero.tsx`).
13. **Content i18n — Level A (labels)**: `localizeValue(locale,prefix,value)` helper + dict keys `genre.*`/`placement.*`/`gender.*`/`category.*`. Applied in project-card, catalog-view (rows + genre & category filters), report-hero, key-facts. Price "Price on request" → localized `keyFacts.onRequest`.
14. **Content i18n — Level B (free content)**: per-locale columns `titleHy/Ru/En`, `synopsisHy/Ru/En` on Project; `format`/`countries` via token dicts in `src/lib/data/projects.ts` (`localizeFormat`/`localizeCountries`). `getProjects(locale)`/`getProject(id,locale)` resolve via `pickLocale` (locale→en→base). Admin form "Translations (hy/ru/en)" section. Seed backfilled hy/ru/en for 6 projects. Verified hy+ru: cards fully in site language. Known nit: "Diaspora (US, France)" splits wrong → falls back to raw.
15. **Product-category filter** localized (agent).
16. **Terms + Privacy** translated to hy/ru/en (agent; per-locale `content` map in each page.tsx, reuses `getLocale`/`LegalPage`). tsc clean.
17. **Clickable card**: whole project card → /reports/[id] via overlay `<Link absolute inset-0 z-10>`, action buttons `z-20`. Image-click bug fixed (was z-0 under image).
18. **Prices on 2 cards** (seed-data): Фул Хаус "$25,000 / scene", Святой 3 "$40,000 / episode" — NOTE: superseded by currency work (will become AMD numeric).
19. **Cast section** relabeled "Актёры и создатели / Cast & Creators / Դерасаннер և ստեղծագործогнер" (cast.title + cast.subtitle). ⚠️ BUG: my Armenian in cast.title/subtitle (i18n.ts:505-506) contains Cyrillic homoglyphs — MUST re-fix to pure Armenian. Correct source: `report.tabs.cast` hy (line 501) = «Դерасаннер» is clean; «ստեղծагործог» clean at i18n.ts:201.

## IN PROGRESS — Currency feature (variant 1, APPROVED, not yet built)

Owner decision: prices entered in **AMD (dram) only** in admin; **витрина converts to selected currency at real rate**. Dropdown next to language switcher: **AMD ֏ / USD $ / EUR €**.
- **FX source chosen**: `https://open.er-api.com/v6/latest/AMD` — free, NO key, updates once/24h. Fetch 1×/day, cache 24h (Next revalidate or DB Setting), **hardcoded fallback rates** on failure (never breaks).
- **Plan**:
  - Schema: money as AMD ints — `budgetMinAmd`,`budgetMaxAmd` (replace budgetRange string), `priceAmd Int?`+`priceUnit String`, `cpmMinAmd/cpmMaxAmd Int?`. Opportunity `estValue` already Int = AMD. Also FIXES the broken budget filter (make it numeric).
  - Data layer: rate fetcher (cache+fallback) + `formatMoney(amountAmd, currency, rates)`.
  - `CurrencySwitcher` component next to `LocaleSwitcher` (same dropdown style) + `currency` cookie.
  - Admin form: numeric AMD (֏) inputs.
  - Seed: convert 6 projects' money to AMD.
  - Render: card/report money via formatMoney(currency, rates).
- Nothing built yet — start here.

## DEFERRED (in memory)
- **project-content-i18n-columns.md** — DONE (Level B).
- **project-disable-text-selection.md** — after dev finishes, `user-select:none` on витрина (NOT admin).
- Logic-review items not yet actioned: anonymity-fake gate, slots invariant, Application FK, dup lead paths, dead Setting/default_lang, dead columns (note/budget), moneyShort en-US.

## Dev/env notes
- Admin: /admin/login · admin@admin.com / admin1234.
- `next.config.ts` changes don't hot-reload cleanly here → kill + `npm run dev` (port 3001); clear `.next/` after heavy churn.
- No prisma migrations dir → schema via `npx prisma db push`; seed via `npx prisma db seed` (deleteMany+create, idempotent).
- next dev server frequently needs manual restart; stop via killing node/next procs.
- Pending: reseed to apply the $-prices (will be replaced by AMD in currency work) + browser-verify categories/terms/privacy/clickable/cast.
