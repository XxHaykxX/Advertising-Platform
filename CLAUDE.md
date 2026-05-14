# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A brokered B2B advertising marketplace for Armenia (Next.js 14 App Router + TypeScript + Prisma/MySQL + NextAuth v5). The platform mediates between Advertisers and Publishers — they never talk directly; every Inquiry goes through the Super Admin team. Solo-developer MVP optimised for free tiers; production runs on Hostinger Business managed Node.js.

## Source of truth — read first

`_bmad-output/planning-artifacts/` is **the** spec. Before adding any non-trivial feature, read the relevant artifact:

- `prd.md` — 80 FRs / 44 NFRs, 4 user journeys, role permissions
- `architecture.md` — 9 ADRs, full Prisma schema, deploy pipeline, security layers
- `ux-design.md` — Modern Dark tokens, component-library mapping (§4), wireframes (§6), interaction patterns (§7), animation specs (§8)
- `epics-and-stories.md` — 64 stories with AC, effort, dependencies, phase placement. Each commit references a story ID (e.g. S-08.1) — use the same convention.

When the spec is silent or contradicts the code, **update the artifact in the same commit**. The artifacts must not drift from the code.

## Commands

```bash
# Day-to-day
docker compose up -d           # MySQL 8 on host port 3307 (3306 reserved on dev machine)
npm run dev                    # http://localhost:3000
npm run type-check             # tsc --noEmit, never skip after schema changes
npm run build                  # next build (also catches client-component SSR errors)
npm run lint
npm run format

# Database
npm run db:push                # apply schema.prisma directly (dev only — no migration files)
npm run db:migrate             # prisma migrate dev (when adding a new story-level migration)
npm run db:deploy              # production-only — never run against local
npm run db:seed                # 18 industries (idempotent upsert)
npm run db:studio              # Prisma Studio on http://localhost:5555

# Dev-only helpers — they exist because Phase 3 admin UIs aren't built yet
npm run db:create-admin -- <email> [<name> <password>]   # promote or create
npm run db:approve -- <email> [APPROVED|REJECTED|NEEDS_INFO] [reason]
npm run db:inquiry -- <inquiry-id-or-tail-8> <action> [note]
# actions: assign, progress, awaiting-publisher, awaiting-advertiser, confirm, lost

# Emails
npm run email:dev              # react-email preview on :3001
```

After any `prisma/schema.prisma` change you must stop the dev server (it holds the Prisma query engine DLL on Windows — `npx prisma generate` will fail with EPERM otherwise), regenerate, then restart.

## Architecture notes that aren't obvious from the file tree

### Route groups and the auth model

- `src/app/(marketing)/` — public pages with `MarketingHeader` + `MarketingFooter` layout. Includes `/catalog` which is also public.
- `src/app/(auth)/` — register, verify, login, forgot-password, reset-password. No header.
- `src/app/admin/` — **not** in a route group on purpose. Every admin page calls `requireAdmin()` from `src/lib/admin-guard.ts` which enforces session + role + TOTP within a 1-hour sliding window. The plan is to move this to an `admin.[domain]` subdomain in prod (DNS-only change).
- Advertiser/publisher cabinet pages live at top-level paths (`/dashboard`, `/inquiries`, `/listings/mine`, `/company-profile`, `/settings/*`). Each does its own `auth()` + role + `canAdvertise`/`canPublish` check inline — no shared layout gate, no middleware.

NextAuth v5 is wired in `src/auth.ts` with **Credentials provider only** (no Prisma adapter — adapter is for OAuth flows we don't have). JWT session strategy. Module augmentation lives in `src/types/next-auth.d.ts` (the JWT type needs a sibling import statement to anchor the augmentation — don't inline it into `auth.ts` or TS will lose the `next-auth/jwt` module).

Admin 2FA state lives in `User.mfaVerifiedAt` (not a cookie — cookies can outlast signOut on shared machines). `requireAdmin()` slides the window on every admin page request; `signOutAdmin()` clears it.

### Server Actions + forms (React 18 quirk)

We're on React 18.3.1, not 19. **Do not use `useActionState`** — it doesn't exist and silently breaks static prerender. The convention is:

- `useFormState` from `react-dom` for the `[state, action]` tuple
- `useFormStatus` (via `<SubmitButton>` in `src/components/ui/submit-button.tsx`) for pending state — must be a child of `<form>`

This is documented in memory `feedback-react18-useformstate` because it bit us once.

### tailwind-merge + custom font sizes

`src/lib/utils.ts` extends `tailwind-merge` to register our custom font sizes (`text-display-xl`, `text-body`, `text-caption`, …). Without that registration, `twMerge` treats them as text-color utilities and silently strips real colors that share the group (e.g. `text-accent-on` dropped from a Button that also sets `text-body`). If you add new font-size keys to `tailwind.config.ts`, also add them to the `font-size` class group in `src/lib/utils.ts`.

### Email is Notification-first

Every transactional notification goes through `tryEmailSend()` in `src/lib/email.ts`. It writes the in-app `Notification` row **before** attempting the email send, so the bell drawer is always source-of-truth even when Resend fails. Failures go to Sentry, never throw. Templates are React Email components in `emails/` with `PreviewProps` for `react-email dev`.

If `RESEND_API_KEY` is unset, codes and reset URLs are logged to the server console — that's how local dev works without Resend setup.

### Storage

- `public/uploads/logos/<companyId>.<ext>` — public company logos, served by the static handler
- `storage/uploads/companies/<id>/verification/<random>.<ext>` — private docs, served only via auth-checked routes (route doesn't exist yet — admin viewer lands in S-03.5)
- Both directories are gitignored — runtime-generated

Helpers in `src/lib/storage.ts`. Allowlists and size limits are enforced server-side; the client-side `accept=` is UX only.

### Rate limiting

`src/lib/rate-limit.ts` is in-memory token-bucket per (key, IP). Architecture decision: no Redis on Hostinger, so single-process state is the floor. Restart clears it — acceptable for auth-flow flood protection. The keys we use today: `login:<ip>` (10/5min), `admin-login:<ip>` (10/5min), `admin-mfa:<ip>` (5/5min), `pwreset:<ip>` (5/hr), `inquiry:<userId>:<ip>` (20/hr).

### Brand voice + design constraints

Hardcoded rules from `ux-design.md`:
- **Lime accent (`#BEFC42`) used ≤3 times per page** — visual review during PR.
- **Forbidden phrases** in user-facing copy: "We're excited", "Awesome", "Welcome back!", "Don't worry". `ux-design.md` §2 lists the design principles ("Confidence over reassurance", "Show, don't ask"). Honest pre-launch copy beats fake trust signals.
- **Modern Dark is the default** — light mode is scoped to marketing pages only via `.light` class (see `src/app/globals.css`).
- Animations match `ux-design.md §8`: 200ms default, easing `cubic-bezier(0.16, 1, 0.3, 1)` = our `ease-out-expo`. Use `motion-safe:` prefix for transforms to respect §8.4 reduced-motion.

### Commit style

Every commit references at least one story ID (`feat(epic): S-XX.Y — title`). The body explains what changed AND any non-obvious decisions / deferrals / blocked dependencies. Recent commits are good examples — read `git log` before writing your first one.

## What's intentionally not here yet

- **Chat** — completely third-party. We don't have a provider chosen; the schema has `advertiserChatThreadId`/`publisherChatThreadId` string fields for the eventual external IDs. Don't add chat tables, don't add WebSocket infrastructure.
- **Background jobs** — no queue. Cron via Hostinger's panel for the daily digest etc. when those land.
- **Edge runtime** — none of our routes use it. bcrypt + Prisma + our Sentry config are all Node-only. Middleware is intentionally absent (page-level `auth()` checks are simpler and Node-compatible).
- **Tests** — no test framework wired in yet. When a story calls for tests, choose vitest + Testing Library and add it explicitly.
