# Deploying to Hostinger — Advertising Platform

End-to-end procedure for deploying this app to the Hostinger Business plan as a managed Node.js web app, per `architecture.md` §10 (ADR-001).

> **TL;DR (subsequent deploys after first-time setup is done):**
> ```bash
> git push origin main                  # local
> ssh user@host                         # then on Hostinger:
> cd ~/htdocs/<APP>
> git pull
> npm ci
> npx prisma generate
> npx prisma migrate deploy             # only if schema changed
> npm run build
> cp -r public .next/standalone/
> cp -r .next/static .next/standalone/.next/
> # then click "Restart" in hPanel → Node.js app
> ```

---

## 1. One-time setup

### 1.1 Prerequisites

- Hostinger Business plan (paid, includes managed Node.js + MySQL).
- A GitHub account with access to the repo (will create below).
- Local: git, Node.js 20.x, npm 10.x.
- `gh` CLI installed and authenticated (`gh auth login`) — optional but speeds up repo creation.

### 1.2 Create the GitHub repository

Local repo is already initialised; `main` is the default branch. Create the GitHub remote and push:

```bash
# Option A — using gh CLI
gh repo create advertising-platform --private --source=. --remote=origin --push

# Option B — manually
# 1. Create empty repo at https://github.com/new (no README/.gitignore — repo is non-empty)
# 2. Then:
git remote add origin git@github.com:<YOUR-USER>/advertising-platform.git
git push -u origin main
```

Branch protection on `main` is optional for a solo project; enable it later if collaborators join.

### 1.3 Provision the Node.js app on Hostinger

In **hPanel → Hosting → Manage → Advanced → Node.js**:

1. **Create new application**.
2. **Application root:** `~/htdocs/advertising-platform` (or any name — call it `<APP>` from here on).
3. **Node version:** 20.x (matches `package.json` engines target; pick the highest 20 available).
4. **Application startup file:** `.next/standalone/server.js`
5. **Application URL:** at this stage the free subdomain assigned by Hostinger, e.g. `https://<your-subdomain>.hostingersite.com`. Custom domain comes in step 1.8.
6. Click **Create**.

> Once created, hPanel shows the SSH connection string and the **Run NPM Install / Run JS Script / Restart** controls. Bookmark this page — you'll come back to it.

### 1.4 Connect GitHub Git deployment

Still in hPanel → Node.js app:

1. Find the **Git deployment** section.
2. Paste the GitHub repo URL (SSH or HTTPS).
3. Branch: `main`.
4. Deploy path: same as the application root (`~/htdocs/<APP>`).
5. Authorise with a GitHub deploy key (Hostinger generates a public key — paste it into GitHub repo → Settings → Deploy keys, read-only is fine).
6. Save. Hostinger will perform the initial pull. The repo now lives on the server but is not yet built.

> Hostinger's Git deployment **only pulls code**. It does NOT run `npm install`, migrations, or build. Those happen in §1.6 below.

### 1.5 Create the MySQL database

In **hPanel → Databases → MySQL Databases**:

1. **Create new database**, name e.g. `u123_adplatform`.
2. **Create user** with a strong password, grant **All privileges** on the new DB.
3. Note: host is `127.0.0.1`, port `3306`. The full connection string for `.env`:
   ```
   mysql://u123_adplatform_user:STRONG_PASS@127.0.0.1:3306/u123_adplatform
   ```

### 1.6 Set environment variables in hPanel

In **hPanel → Node.js app → Environment variables**, add each key from `.env.example`. Required for first boot:

| Key | Source / how to generate |
|---|---|
| `DATABASE_URL` | from §1.5 |
| `NEXTAUTH_URL` | the full HTTPS URL (e.g. `https://<your-subdomain>.hostingersite.com`) |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` (run locally) |
| `TWOFACTOR_ENCRYPTION_KEY` | `openssl rand -base64 32` (run locally) |
| `RESEND_API_KEY` | leave empty until S-06.1 |
| `EMAIL_FROM` | leave empty until S-06.1 |
| `SENTRY_DSN` | leave empty until configured |
| `NEXT_PUBLIC_POSTHOG_KEY` | leave empty until configured |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://eu.posthog.com` |
| `NODE_ENV` | `production` |

> **Never** commit a populated `.env` — `.gitignore` already excludes it. Env values live only in hPanel.

### 1.7 First-time SSH bootstrap

Open the SSH terminal (hPanel → **Advanced → SSH Access**, or use any SSH client with the provided host/port/user). Then:

```bash
cd ~/htdocs/<APP>

# 1. Install production deps (postinstall runs prisma generate via package.json)
npm ci

# 2. Apply schema to the production DB (creates User, Company tables)
npx prisma migrate deploy
# If you have not created any migrations yet (only schema.prisma):
#   npx prisma db push   ← use ONCE during S-01.2 bootstrap, then switch to migrations

# 3. Build Next.js in standalone mode
npm run build

# 4. Copy public/ and .next/static/ into the standalone output
#    (Next.js standalone does not include these by design)
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/

# 5. Restart the Node.js app from hPanel (button under app overview).
#    Alternatively, hPanel has a "Run JS script" runner you can point at server.js.
```

### 1.8 Verify

1. Open `https://<your-subdomain>.hostingersite.com` — the page should render **ADVERTISING.** with the lime accent (same as `localhost:3000`).
2. Check HTTPS works (Hostinger provisions Let's Encrypt automatically on subdomain creation; for custom domain, see §1.9).
3. Open browser devtools → Network → verify the cert is valid (no warnings) and pages return 200.

If the page returns 502 or a generic Node.js placeholder:
- Re-check **Application startup file** = `.next/standalone/server.js`.
- Re-check that `cp -r public .next/standalone/` and `cp -r .next/static .next/standalone/.next/` ran.
- Open hPanel → Node.js app → **Logs** (or `cat ~/htdocs/<APP>/logs/*.log` over SSH).

### 1.9 Attach a custom domain (later)

When the production domain is ready:

1. **hPanel → Domains → Add domain** — point the domain to this hosting account.
2. **hPanel → Node.js app → Domain** — link the domain to the Node.js application.
3. **hPanel → SSL** — provision Let's Encrypt for the custom domain (free, auto-renews every 90 days).
4. Update `NEXTAUTH_URL` env var in hPanel to the new `https://yourdomain.tld` and restart the app.

---

## 2. Subsequent deploys

Once §1 is done, every release follows this loop:

```bash
# 1. Local: push the change
git push origin main

# 2. SSH into Hostinger
cd ~/htdocs/<APP>
git pull origin main                       # OR: hPanel → Git deployment → "Deploy now"
npm ci                                     # only if package-lock changed
npx prisma generate                        # only if schema.prisma changed
npx prisma migrate deploy                  # only if a new migration was added
npm run build
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/

# 3. hPanel → Node.js app → Restart
```

> If nothing schema-related changed, skip `prisma migrate deploy` — `migrate deploy` is idempotent so running it does no harm, but it adds latency.

### 2.1 Schema migration workflow

When you change `prisma/schema.prisma`:

```bash
# locally
npx prisma migrate dev --name <descriptive_name>
# this creates prisma/migrations/<timestamp>_<name>/migration.sql, commit it.
git add prisma/migrations
git commit -m "feat(db): <description>"
git push origin main
```

Then on Hostinger:
```bash
npx prisma migrate deploy
```

`migrate deploy` is non-interactive and will only apply pending migrations.

### 2.2 Rollback

Hostinger Business has **daily filesystem and database snapshots**, retained 30 days. For code rollback:

1. hPanel → **Backups → File Manager Backup** → pick a date → restore `~/htdocs/<APP>`.
2. Restart the Node.js app.

For database rollback after a bad migration:
1. hPanel → **Backups → MySQL Database Backup** → restore the DB to the previous day.
2. Run `npx prisma migrate resolve --rolled-back <migration_name>` to mark the migration as rolled back in `_prisma_migrations`.
3. Optionally re-deploy a fixed migration.

A more detailed runbook will live at `docs/runbook-rollback.md` (TBD).

---

## 3. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Page returns 502 Bad Gateway | App not started or crashed on boot | Check Node.js app logs in hPanel. Most common: missing env var → `NEXTAUTH_SECRET is undefined` |
| Page renders but no styles | `.next/static` not copied into standalone | Re-run `cp -r .next/static .next/standalone/.next/` |
| Page renders but images / `public/` 404 | `public/` not copied | Re-run `cp -r public .next/standalone/` |
| Build fails: `Prisma Client did not initialize` | `prisma generate` skipped | Run `npx prisma generate` before `npm run build` |
| DB connection error: `ECONNREFUSED 127.0.0.1:3306` | Wrong DB host or DB user lacks privileges | Verify `DATABASE_URL`. Hostinger DB is always `127.0.0.1:3306` from the app server. |
| `prisma migrate deploy` says "Database is up to date" but tables missing | First-ever boot — use `prisma db push` once, then switch to migrations | See §1.7 |
| Custom domain serves a placeholder Hostinger page | Domain not linked to the Node.js app | hPanel → Node.js app → Domain → link the domain |

---

## 4. References

- Architecture decisions: `_bmad-output/planning-artifacts/architecture.md` §10 (ADR-001, ADR-002, ADR-005).
- Story spec: `_bmad-output/planning-artifacts/epics-and-stories.md` → S-01.2.
- Hostinger Node.js docs: [https://support.hostinger.com](https://support.hostinger.com) (search "Node.js application").
- Prisma `migrate deploy`: [https://www.prisma.io/docs/orm/prisma-migrate/workflows/production-and-testing](https://www.prisma.io/docs/orm/prisma-migrate/workflows/production-and-testing).
