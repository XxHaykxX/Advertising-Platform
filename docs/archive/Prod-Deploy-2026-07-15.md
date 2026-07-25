# Prod Deploy — 2026-07-15

Deploying current `main` (auth feature + report/homepage tweaks) to prod `igovazd.am`.

## Key fact: the deploy chain does NOT migrate the DB

Hostinger git auto-deploy (push to `main`) runs only `npm install` (→ postinstall `prisma generate`) + `next build`. It never runs `db:push` / `db:seed` / `prisma migrate`. **Every `schema.prisma` change must be applied to the prod DB manually, BEFORE pushing the code** — otherwise the freshly generated Prisma client selects columns the prod table lacks and crashes at runtime (including the existing `/admin/login`).

## Prod DB access (from workstation)

- DB `u998961932_advertising` on Hostinger account `u998961932`, remote rule `ip:"%"` (open).
- Host `srv2026.hstgr.io` (or IP `92.113.22.155`), port `3306`.
- Password: in hPanel (not committed). URL-encode `#` → `%23` in `DATABASE_URL`.
- Temp URL (in-memory only, never written to `.env`):
  `mysql://u998961932_advertising:<pw>@srv2026.hstgr.io:3306/u998961932_advertising`

## Pending migration SQL (prod → current `main`)

Preview via `prisma migrate diff --from-url "$PROD_URL" --to-schema-datamodel prisma/schema.prisma --script` produced:

```sql
-- DropForeignKey
ALTER TABLE `PlacementOpportunity` DROP FOREIGN KEY `PlacementOpportunity_projectId_fkey`;

-- AlterTable  (commit 17e68f0 — age-rating badge, drop slots)
ALTER TABLE `Project` DROP COLUMN `slotsTaken`,
    DROP COLUMN `slotsTotal`,
    ADD COLUMN `ageRating` VARCHAR(191) NOT NULL DEFAULT '';

-- AlterTable  (auth feature — additive, backward-compatible)
ALTER TABLE `User` ADD COLUMN `company` VARCHAR(191) NULL,
    ADD COLUMN `googleId` VARCHAR(191) NULL,
    ADD COLUMN `status` ENUM('PENDING','APPROVED','REJECTED','BLOCKED') NOT NULL DEFAULT 'APPROVED',
    MODIFY `passwordHash` VARCHAR(191) NULL,
    MODIFY `role` ENUM('SUPERADMIN','PUBLISHER','BRAND','CREATOR') NOT NULL DEFAULT 'PUBLISHER';

-- DropTable  (commit 17e68f0 — opportunities feature removed)
DROP TABLE `PlacementOpportunity`;

-- CreateIndex
CREATE UNIQUE INDEX `User_googleId_key` ON `User`(`googleId`);
```

### Data-loss notes
- `Project.slotsTaken` / `slotsTotal` dropped, and table `PlacementOpportunity` dropped — **irreversible** on prod. Matches the intentional feature removal in commit `17e68f0`. Requires `--accept-data-loss` on `db push`.
- The `User` block is purely additive/relaxing (safe).

Prod was behind commit `17e68f0` (still had slots cols + PlacementOpportunity, lacked ageRating) and lacked all auth `User` columns.

## Deploy sequence

1. Migrate prod DB: `DATABASE_URL="$PROD_URL" npx prisma db push --accept-data-loss` (after reviewing the diff above).
2. `git add -A && git commit` (auth + tweaks).
3. `git push origin main` → Hostinger auto-build.
4. Smoke test: `/admin/login`, `/register`, `/login`, `/reports/7`, `/catalog`.

Google OAuth stays OFF (no creds → button hidden). Indexing stays OFF (noindex + robots disallow).

## Post-deploy incident: DB auth failure (resolved)

After the DB migration + app restart, every Project-querying page (`/`, `/catalog`, `/reports/*`) returned 500 with
`PrismaClientInitializationError: Authentication failed against database server, the provided database credentials for u998961932_advertising are not valid`.
Non-DB pages (`/register`, `/login`, `/admin/login`) stayed up. Root cause: the password in the hPanel Node.js
`DATABASE_URL` env did not match the live DB password (mismatch and/or a literal `#` in the URL, which Prisma
truncates as a fragment delimiter).

Fix: reset the DB password to a pure alphanumeric value via MCP `hosting_changeDatabasePasswordV1`, update the hPanel
`DATABASE_URL` env to match (`@127.0.0.1:3306`), restart the Node app. The live password value is NOT stored in this
repo — it lives in the hPanel env and in local agent memory (`prod-deploy-migration.md`).

**Lesson:** rotating the DB password REQUIRES also updating the hPanel `DATABASE_URL` env; prefer passwords without
URL-special characters (`#`, `@`, `/`, `?`). The Hostinger MCP has no tool to read/set Node.js app env vars — only the
owner can edit `DATABASE_URL` in hPanel.
