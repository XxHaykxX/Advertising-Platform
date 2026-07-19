# Member header navigation — design (2026-07-19)

## Problem
The public top header (`src/components/header.tsx`) renders the same marketing nav
(`Կատալոգ / Պորտֆոլիո / Մեր մասին / Կոնտակտներ`) to everyone. A signed-in member
(BRAND/CREATOR) therefore sees marketing links plus their cabinet navigation
(BRAND sidebar / CREATOR dashboard) at the same time — double navigation, and
`Կատալոգ` visibly duplicates the BRAND cabinet's Browse. Reported by the product
owner as confusing for logged-in members.

## Decision (option B — minimal header for members)
Role navigation already lives where it belongs — inside each cabinet (BRAND has a
full sidebar; CREATOR has a dashboard page). So the header does **not** need
role-specific product links. Keep the header uniform and minimal for members
instead of duplicating cabinet links.

- **Guest** (`user == null`): unchanged — full marketing nav + Sign In button.
- **Staff** (`SUPERADMIN / PUBLISHER / MODERATOR`): unchanged — keep marketing nav
  (explicitly out of scope; staff operate in `/admin`).
- **Member** (`BRAND / CREATOR`): the 4 marketing links are replaced by a single
  `Անձնական էջ` link (`nav.cabinet` → `cabinetHrefFor(role)`), so the header still
  offers a clear path but no marketing clutter. Same for both member roles — a
  separate BRAND-vs-CREATOR header menu is **not** needed; the role difference is
  already expressed by the cabinet each `cabinetHrefFor(role)` points to.

The wordmark (→ cabinet) and avatar menu (Cabinet · Logout) are unchanged and keep
providing cabinet/logout access.

## Implementation
Single file: `src/components/header.tsx`.
- Derive `isMember = user != null && !STAFF_ROLES.includes(user.role)`.
- Desktop nav (`<nav>`): when `isMember`, render the single cabinet link; otherwise
  render the existing `NAV.map` marketing links.
- Mobile panel: when `isMember`, skip the marketing `NAV.map` (the existing signed-in
  user block already renders the cabinet link + logout); otherwise render `NAV.map`.
- No new i18n keys (`nav.cabinet` already exists, used by the avatar menu).
- Staff and guest branches untouched.

## Out of scope
- Any change to cabinet sidebars/dashboards.
- Staff header.
- Marketing pages themselves (remain in footer for everyone).

## Verification
- Local `/browse` on dev:3001: guest header (full nav), signed-in BRAND header
  (single cabinet link, no marketing), signed-in CREATOR header (same). Desktop +
  mobile. `npx tsc --noEmit` = 0.
