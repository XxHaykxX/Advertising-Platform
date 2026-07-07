# Publisher Accounts — Design Spec

**Date:** 2026-07-07
**Status:** Approved design, planning only (no implementation yet)
**Task:** #1

## Goal

Let the super-admin issue login/password to specific film producers ("Publishers").
A Publisher logs into the existing admin panel and adds/edits **their own** film
projects (placements), which publish to the public catalog **immediately** (no
moderation). The Publisher sees only their own projects — nothing else in the panel.

## Decisions (locked)

1. **Publish model:** instant, no moderation (A).
2. **Publisher scope:** own projects only (films + their scenes/actors). Applications,
   partners, portfolio, content, settings, users — all hidden from Publishers (A).
3. **Auth architecture:** unified `User` table with role `SUPERADMIN | PUBLISHER`.
   Email + password login for everyone. No self-registration — super-admin creates
   Publisher accounts.
4. **Portfolio:** stays super-admin-only to create/edit, but each portfolio item can
   be attributed to a Publisher; the public site shows that Publisher's company name.
5. **Super-admin identity:** email `admin@admin.com`.
6. **Publisher profile:** a single field — **company name** (plus email + password).
7. **Trilingual content:** all three languages (RU/EN/HY) are **required** on every
   translatable Project field (and on Scenes/Actors). Form validation blocks save until
   filled.
8. **Pricing/slots:** the **Publisher** sets `price`, `currency`, `slotsTotal`,
   `slotsAvailable`, `bookingDeadline` on their own films.
9. **Catalog order:** `sortOrder` is **super-admin only** — hidden from Publishers so
   they cannot push themselves to the top.
10. **Deactivation:** **instant** — `isActive` is checked against the DB on every
    admin request (see Auth), so deactivating a Publisher closes access immediately.
11. **Broker model:** brand applications stay visible to the **super-admin only**.
    Publishers never see leads for their films. (Confirmed — stays within scope A.)

## Data Model (Prisma)

New model:

```
model User {
  id           Int      @id @default(autoincrement())
  email        String   @unique
  passwordHash String
  role         Role     @default(PUBLISHER)
  name         String   // for PUBLISHER = company name (shown in portfolio); for SUPERADMIN = "Admin"
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())

  projects  Project[]
  portfolio Portfolio[]
}

enum Role {
  SUPERADMIN
  PUBLISHER
}
```

Changes to existing models:

- `Project`: add `ownerId Int` + relation `owner User @relation(fields: [ownerId], references: [id])`.
- `Portfolio`: add `publisherId Int?` + relation `publisher User? @relation(fields: [publisherId], references: [id], onDelete: SetNull)`.

## Auth / Session

- Session JWT payload changes from `{ admin: true }` to `{ uid, role }`.
- `verifySessionToken` returns `{ uid: number, role: Role } | null` instead of `boolean`.
  Callers of `isAuthed()` update accordingly.
- New helpers: `requireUser()` (any logged-in user) and `requireSuperadmin()` (403 otherwise).
- **Instant deactivation:** `requireUser()` (Node runtime, server components/actions)
  loads the user from the DB and rejects if `isActive=false` — so a deactivated
  Publisher is locked out on the very next request. Edge middleware still only verifies
  the JWT signature/expiry (it cannot run Prisma); the authoritative `isActive` gate
  lives in `requireUser()`, which every admin page/action calls.
- Password hashing moves from `Setting.admin_password_hash` to `User.passwordHash`
  (bcryptjs, already a dependency).
- Login page (`/admin/login`) gains an **email** field (currently password-only).
  On submit: look up `User` by email, verify `passwordHash`, require `isActive`,
  issue `{ uid, role }` session.
- Middleware continues to gate `/admin`; unchanged beyond verifying the new token shape.

## Admin Panel Scoping (decision A)

- **Nav (`src/components/admin/…`):** for `PUBLISHER`, render only the **Projects** link.
  Hide Applications, Partners, Portfolio, Content, Settings, Users.
- **Projects list/edit:** `PUBLISHER` queries are filtered to `where: { ownerId: session.uid }`.
  Direct navigation to another owner's `/admin/projects/[id]/edit` returns **403**.
- **New project:** `ownerId` is force-set to `session.uid` for a Publisher; publishes
  to the catalog immediately (`isActive` default true, no moderation flag).
- **Publisher project form:** can edit content (trilingual title/genre/description/
  placement, poster/gallery, scenes, actors) AND commercial fields (`price`, `currency`,
  `slotsTotal`, `slotsAvailable`, `bookingDeadline`). The `sortOrder` field is hidden
  and ignored on save for Publishers (server keeps existing value / default).
- **Trilingual validation:** save is blocked until RU/EN/HY are all filled on every
  translatable field of the project and its scenes/actors.
- **SUPERADMIN:** sees and edits everything, including all projects regardless of owner,
  plus `sortOrder`.
- **Projects list (super-admin):** add an **owner / Publisher** column so you can see
  who added each film.

## Account Management UI (SUPERADMIN only)

- New section `/admin/(panel)/users`:
  - List users (email, company name, role, active).
  - Create Publisher: email + company name + password.
  - Deactivate (sets `isActive=false`, blocks login; content stays live).
  - Reset password.
- Guarded by `requireSuperadmin()`.

## Portfolio Attribution

- Super-admin portfolio create/edit form gains an optional **Publisher** selector
  (dropdown of `role=PUBLISHER` users).
- Public portfolio page/card shows `publisher.name` (company name) when set; hidden otherwise.
- Publishers still cannot see or edit portfolio.

## Account Deletion Policy

- No hard delete of Publishers. Deactivation (`isActive=false`) closes login while
  keeping their projects live in the catalog and portfolio attributions intact.

## Security Guards (mandatory, not optional)

- **URL-level authz on every non-project admin route:** applications, partners,
  portfolio, content, settings, users pages/actions all call `requireSuperadmin()`
  server-side. Hiding nav links is not enough — a Publisher could type the URL.
- **Nested-resource ownership:** server actions for Scene/Actor create/edit/delete
  verify the parent `Project.ownerId == session.uid` (Publishers), not just the project
  page. Super-admin bypasses.
- **Upload endpoint (`/api/admin/upload`):** restrict `type` by role — a Publisher may
  only upload `posters | gallery | actors`; `portfolio | partners` are super-admin only.
  Keep existing 5 MB limit and jpg/png/webp allow-list.
- **Password change (settings):** now updates `User.passwordHash` for the *current*
  user, not `Setting.admin_password_hash`.
- **Password hand-off:** super-admin communicates new Publisher credentials manually
  (no email delivery). Recovery flow is out of scope.

## Migration

1. Create `User` table + `Role` enum; add `Project.ownerId`, `Portfolio.publisherId`.
2. Seed SUPERADMIN: `email=admin@admin.com`, `name="Admin"`, `role=SUPERADMIN`,
   `passwordHash` copied from existing `Setting.admin_password_hash` (fallback: hash a
   provided password if the setting is empty).
3. Backfill: set `Project.ownerId` on all existing projects to the SUPERADMIN id.
4. `Portfolio.publisherId` starts null for existing items.
5. `ownerId` becomes required after backfill.

## Out of Scope (YAGNI)

- Applications-per-project / Publisher seeing leads.
- Publisher-managed portfolio.
- Payments / slot deposits.
- Self-registration and email-based password recovery.

## Open Risks / Notes

- `admin@admin.com` is a weak placeholder identity — fine for a single internal
  super-admin, but the seed password must be strong (reuse the current admin password).
- Session shape change is breaking: every existing admin session cookie is invalidated
  on deploy (users re-login once). Acceptable.
