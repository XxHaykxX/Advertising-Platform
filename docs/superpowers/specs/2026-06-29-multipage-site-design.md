# Multi-page site — design spec

**Date:** 2026-06-29
**Status:** Approved (design), pending implementation plan

## Goal

Convert the public site from a single-page anchor-scroll landing into a
multi-page site. Each of the current landing sections becomes its own route.
The home page (`/`) becomes a compact hub linking to those routes.

Out of scope: no database/model changes, no public auth/accounts, no marketplace
or booking features. `/experience`, `/hero-scroll`, `/privacy`, `/consent` stay
as they are.

## Current state (facts)

- Home `src/app/(site)/page.tsx` renders 6 sections in one vertical scroll:
  Hero → HowItWorks (`#how`) → Catalog (`#catalog`) → Portfolio (`#portfolio`)
  → Partners (`#partners`) → Contact (`#contact`).
- Section components live in `src/components/sections/*`.
- `site-header.tsx` `NAV` (lines 15-21) uses anchor hrefs; `go()` (lines 96-107)
  intercepts clicks and smooth-scrolls via Lenis, or routes to `/#anchor` when
  off the home page. `site-footer.tsx` repeats the same anchors plus real routes
  `/privacy`, `/consent`.
- Existing subpages: `/projects/[id]` (SSG detail), `/experience`, `/hero-scroll`,
  `/privacy`, `/consent`.
- `(site)/layout.tsx` wraps everything in `SmoothScroll` + header + footer.
- Data readers (unchanged): `getProjects`, `getProject`, `getPortfolioCases`,
  `getPartners`, `getContacts`, `getContent`, `getLocale`.

## Chosen approach: C (Hybrid)

Reuse existing section components on new routes, with targeted fixes where a
section assumes the long-scroll context, plus a per-page header. Fast like a
straight reuse, but avoids visual artifacts from pulling a section out of its
original scroll context.

## Design

### 1. Routes / files

New `page.tsx` files under the `(site)` route group:

```
src/app/(site)/
├── page.tsx              → / (rewrite into hub)
├── how-it-works/page.tsx → /how-it-works   (new)
├── catalog/page.tsx      → /catalog        (new)
├── portfolio/page.tsx    → /portfolio      (new)
├── partners/page.tsx     → /partners       (new)
├── contact/page.tsx      → /contact        (new)
├── projects/[id]/page.tsx (unchanged)
├── experience/ hero-scroll/ privacy/ consent/ (unchanged)
```

Each new page is a server component that fetches the same data the section
needs (via existing data readers + `getLocale`) and renders the existing
section component plus a `PageHeader`.

### 2. Navigation (`site-header.tsx`, `site-footer.tsx`)

- `NAV` hrefs change from anchors to routes:
  `/how-it-works`, `/catalog`, `/portfolio`, `/partners`, `/contact`.
- Remove the `go()` smooth-scroll/Lenis click interception; use plain `<Link>`.
- Active link state derived from `usePathname()`.
- Footer keeps the same route links plus `/privacy`, `/consent` as today.

### 3. Home hub (`/`)

New `home-hub` component: reuse `<Hero/>` at the top, followed by a grid of
teaser cards (Catalog, How it works, Portfolio, Partners, Contact). Each card is
a `<Link>` to its route. The Catalog teaser may show 3-4 posters pulled from
`getProjects`.

### 4. Targeted section fixes (the substance of approach C)

- Remove now-unused anchor `id`s (`#how`, etc.) — or leave them harmlessly.
- Where parallax / `framer-motion` is tied to the long home-page scroll
  (`useScroll` offsets), verify on the standalone page and adjust triggers so
  there are no empty gaps or unfinished animations.
- Add a `PageHeader` (title + subtitle sourced from `Content`) to each new page.
- Move the Contact section to `/contact` (form unchanged).

### 5. SEO / metadata

Each new page exports its own `metadata` (locale-aware title/description).
Today everything lives under a single `/` metadata.

### 6. Lenis / SmoothScroll

Keep `SmoothScroll` in `(site)/layout.tsx` — it works fine across multiple
pages. Only the hash-based navigation is removed.

## Components / boundaries

- `home-hub` — owns the hub layout; depends on `Hero` + `getProjects` (teasers).
- New `page.tsx` files — thin server wrappers: fetch data, render `PageHeader` +
  section component. One clear purpose each.
- `PageHeader` — presentational, title/subtitle in; no data access.
- Section components — unchanged public interface; internal scroll-trigger
  tweaks only.
- Navigation components — route links + active state; no smooth-scroll logic.

## Risks / testing

- Main risk: section animations behaving oddly outside the long scroll — handled
  in §4.
- `/catalog` client-side search/filter must still work as a standalone page.
- Manual run: `npm run dev`, visit all 6 routes, navigate from hub, open a film
  detail (`/projects/[id]`), check header/footer active states and legal links.
- Confirm no remaining `/#anchor` links anywhere.

## Definition of done

- `/` is a hub; `/how-it-works`, `/catalog`, `/portfolio`, `/partners`,
  `/contact` exist and render their content.
- No anchor-scroll navigation remains in header/footer.
- Each page has its own metadata.
- All routes verified manually in dev; no console errors; no broken animations.
