---
workflowType: 'architecture'
project_name: 'Advertising Platform'
author: 'Winston (System Architect)'
date: '2026-05-13'
inputDocuments:
  - 'prd.md'
  - 'Advertising_Platform_TZ_v3.1.md'
  - 'Claude_Code_Kickoff.md'
status: 'COMPLETE'
---

# System Architecture — Advertising Platform

**Author:** Winston (BMAD System Architect)
**Date:** 2026-05-13
**Status:** v1, ready for implementation
**Companion docs:** `prd.md` (capability contract), `ux-design.md` (interface spec — pending Sally)

## 1. Architecture Overview

Single Next.js 14 application (TypeScript, App Router, `output: 'standalone'`) deployed as a managed Node.js web app on Hostinger Business. One MySQL database on the same host. File storage on the host's filesystem. Third-party services for chat (TBD provider), email (Resend), error monitoring (Sentry), and analytics (PostHog). All external services on free tiers.

```
                       Internet
                          │
                          ▼
              ┌──────────────────────┐
              │  Hostinger Business  │
              │   ┌──────────────┐   │      ┌────────────┐
              │   │  Next.js 14  │   │◀────▶│ Chat Prov. │
              │   │  (standalone)│   │      │  (TBD)     │
              │   │              │   │      └────────────┘
              │   │  - App Rtr   │   │      ┌────────────┐
              │   │  - API Rts   │   │◀────▶│  Resend    │
              │   │  - Srv Acts  │   │      └────────────┘
              │   └──────┬───────┘   │      ┌────────────┐
              │          │           │◀────▶│  Sentry    │
              │   ┌──────▼──────┐    │      └────────────┘
              │   │   MySQL     │    │      ┌────────────┐
              │   │  (Prisma)   │    │◀────▶│  PostHog   │
              │   └─────────────┘    │      └────────────┘
              │   ┌─────────────┐    │
              │   │  storage/   │    │
              │   │  uploads/   │    │
              │   └─────────────┘    │
              └──────────────────────┘
```

### 1.1 Architectural style

- **Modular monolith.** Single deployable unit. No microservices, no separate API backend, no edge functions. Justified by team size (solo developer), traffic projection (≤1,000 concurrent users in MVP), and operational simplicity.
- **Server-first.** Marketing pages use Next.js SSR for SEO. Cabinet and admin pages use a mix of SSR and React Server Components with selective client-side hydration. Server Actions handle all mutations; API routes only where a public/external contract is needed (chat provider webhook, file streaming).
- **Application-level authorization.** No row-level security in MySQL (Postgres RLS not available). Every server-side handler validates the session and authorizes the action before touching the database.

### 1.2 Non-architecture (what we deliberately don't have)

- No microservices, no service mesh, no message queue, no Redis. Everything in-process or in MySQL.
- No edge functions, no ISR through Vercel-specific infrastructure.
- No self-hosted real-time layer (WebSocket / Pusher / Socket.io). Chat is delivered entirely by the third-party provider.
- No separate analytics database, no data warehouse. PostHog handles product analytics; admin reports query MySQL directly.
- No Kubernetes, no Docker in production (Hostinger Managed Node.js handles process lifecycle).

## 2. Architecture Decision Records (ADRs)

Each ADR records: decision, context, alternatives considered, consequences. ADRs are immutable — supersede with a new ADR, never edit.

### ADR-001 — Hosting on Hostinger Business

- **Decision:** Deploy as Managed Node.js web app on Hostinger Business plan (already paid by project owner).
- **Context:** Solo developer, free-tier-only constraint (with the Hostinger plan itself as the one paid item), 3–4 month MVP timeline, no infrastructure expertise to build.
- **Alternatives considered:**
  - *Vercel:* great DX, but vendor lock-in and per-usage billing risk at scale. Rejected (cost).
  - *Self-hosted VPS:* maximum control but full sysadmin burden. Rejected (solo dev time).
  - *AWS / GCP / Azure:* overkill for this scale, free tiers are short-lived. Rejected (complexity, cost).
- **Consequences:**
  - No edge functions; all routes run in a single Node process.
  - Deployment via GitHub Git deployment integration + manual SSH steps for migrations.
  - Limited to MySQL (no PostgreSQL on Hostinger shared plans).
  - 50 GB filesystem available for uploads.

### ADR-002 — MySQL via Prisma ORM

- **Decision:** Use MySQL (Hostinger built-in) accessed exclusively through Prisma ORM with the `mysql2` driver.
- **Context:** PostgreSQL not available on Hostinger. The team needs schema migrations, TypeScript type safety, and developer ergonomics.
- **Alternatives considered:**
  - *Raw mysql2:* faster but no migrations, no type safety. Rejected (developer time).
  - *TypeORM / Sequelize:* more mature for SQL but worse TypeScript story. Rejected (DX).
  - *Drizzle ORM:* lighter, faster, but smaller ecosystem and less battle-tested with MySQL. Acceptable alternative, kept on the table for Phase 2.
- **Consequences:**
  - No PostgreSQL-specific features (no `JSONB` operators, no `RLS`, no `pg_trgm`). Use MySQL JSON, application-level RLS, MySQL FULLTEXT INDEX.
  - Use `String @id @default(cuid())` for primary keys.
  - All long-text fields use `@db.Text` or `@db.LongText` explicitly.
  - All foreign keys declare `onDelete: Cascade` or `onDelete: Restrict` explicitly.

### ADR-003 — NextAuth.js v5 (Auth.js) for authentication

- **Decision:** Use NextAuth.js v5 with Prisma adapter, Credentials provider (email/password), JWT session strategy, bcrypt password hashing.
- **Context:** No Supabase Auth (we're not on Supabase). Solo developer cannot build auth from scratch correctly.
- **Alternatives considered:**
  - *Clerk:* great DX, free tier is generous (10k MAU), but adds an external dependency on a hosted auth service. Free-tier-first constraint allows it, but lock-in risk.
  - *Lucia Auth:* lighter, fully self-hosted, but the developer must build the UI and flows.
  - *Roll-your-own:* off the table.
- **Consequences:**
  - JWT sessions (no server-side session store needed).
  - Email verification + password reset use NextAuth's built-in flows + Resend for delivery.
  - Two-factor (TOTP) for admins is custom-built on top of NextAuth (not native).
  - All authorization is application-level (no Postgres RLS).

### ADR-004 — Chat as third-party widget

- **Decision:** All inquiry messaging is delivered by a third-party chat provider (specific provider TBD before Phase 3). Platform stores only thread IDs on the `Inquiry` row. Messages do not live in our MySQL.
- **Context:** Building real-time chat is multi-week work that would consume MVP budget. Provider must have free tier covering ~130 MAU.
- **Alternatives considered:**
  - *Self-hosted Socket.io / Pusher / Ably:* requires designing real-time infrastructure, persisting messages, building UI from scratch. Rejected (time).
  - *Stream Chat / Sendbird / Talk.js:* all are candidate providers. To be evaluated at week 8–9.
  - *Email-only first contact:* fallback if no provider's free tier fits.
- **Consequences:**
  - Provider switch is bounded — only thread IDs to migrate, not message history.
  - The platform's analytics on chat (read rates, response times) come from provider webhooks, not our DB.
  - If no free tier fits MVP volume, fall back to email-only first contact and defer chat to Phase 2.

### ADR-005 — File storage on Hostinger filesystem

- **Decision:** All uploaded files stored on Hostinger's filesystem under `storage/uploads/<entityType>/<entityId>/<random>.<ext>` (outside `public/` and `.next/`).
- **Context:** Free-tier constraint. Cloudflare R2 (10 GB free) was on the table but adds external dependency. Hostinger gives 50 GB.
- **Alternatives considered:**
  - *Cloudflare R2 / Backblaze B2 / S3:* better CDN, but more setup. Free tiers fit MVP but add a service to manage.
- **Consequences:**
  - All file serves go through a Next.js API route (`/api/files/[...path]`) with authentication and authorization checks.
  - Public files (logos): may be placed in `public/uploads/logos/` for direct CDN serving via Hostinger's static-asset handler.
  - Backups: covered by Hostinger's daily filesystem snapshots.
  - Migration off Hostinger later means moving file contents — acceptable cost at MVP scale.

### ADR-006 — No real-time infrastructure on the platform

- **Decision:** No WebSocket / SSE / Pusher / Ably / Socket.io. The only real-time component is the chat widget, which is third-party.
- **Context:** Real-time features in MVP scope are: chat (handled by provider), notification bell counts (handled by polling on page load), SLA timer countdown (handled by client-side timer based on server timestamp). None require server-pushed updates.
- **Consequences:**
  - Notification bell shows fresh counts on page load; users won't see new notifications without a page refresh. Acceptable for MVP.
  - The admin queue refreshes on page load; admins won't see new inquiries appear in real-time. Acceptable — they poll their queue manually anyway.

### ADR-007 — Application-level authorization (no RLS)

- **Decision:** Every Server Action and API route validates `auth()` and authorizes the operation in application code before any database access. No row-level security in MySQL.
- **Context:** Postgres RLS would have provided defense-in-depth but it's not available on MySQL. We compensate with disciplined helpers and code review.
- **Consequences:**
  - A library of authorization helpers lives in `src/lib/auth-helpers.ts` and is imported by every protected handler.
  - All handlers follow the pattern: `const session = await auth(); requireRole(session, 'ADVERTISER'); requireOwnInquiry(session, inquiryId);` at the top of every protected function.
  - Code review acceptance criterion: every server-side write must include an authorization check on the first 5 lines.

### ADR-008 — Server Actions for mutations, API Routes for external contracts

- **Decision:** Use Next.js Server Actions for all internal mutations triggered from the UI. Use API Routes only for: chat-provider webhooks, file streaming (`/api/files`), and external integration callbacks.
- **Context:** Server Actions reduce boilerplate (no separate API route + fetch client), are typed end-to-end, and integrate with form submission natively.
- **Consequences:**
  - Internal API surface is tiny — most routes don't exist; mutations are colocated with the components that trigger them.
  - The few API routes that do exist follow REST conventions and are documented separately in `docs/api.md`.

### ADR-009 — Free-tier services only

- **Decision:** All external services must work on a free tier for MVP. No paid subscriptions outside the Hostinger plan.
- **Context:** Project owner's hard constraint.
- **Services and free-tier limits:**
  - Resend: 3,000 emails/month — well above MVP volume.
  - Sentry: 5,000 events/month — acceptable for MVP error rates.
  - PostHog Cloud: 1M events/month — well above MVP volume.
  - Chat provider: must have a free tier covering ~130 MAU. To be selected.
- **Consequences:**
  - Volume caps need monitoring; alerts at 70% of each cap.
  - If any cap is hit, project owner is consulted before upgrading to a paid tier.

## 3. Application Architecture

### 3.1 Next.js layout

The application uses the Next.js 14 App Router with `output: 'standalone'` (required for Hostinger Node.js deployment).

```
src/app/
├── (marketing)/        # public-facing pages (homepage, about, how-it-works)
│   ├── layout.tsx      # marketing nav + footer
│   ├── page.tsx        # homepage
│   ├── about/page.tsx
│   └── how-it-works/page.tsx
├── (auth)/             # login / register / forgot-password
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── forgot-password/page.tsx
├── (app)/              # advertiser + publisher cabinets
│   ├── layout.tsx      # cabinet sidebar
│   ├── dashboard/page.tsx
│   ├── catalog/page.tsx
│   ├── inquiries/page.tsx
│   ├── wishlist/page.tsx
│   └── listings/page.tsx  # publisher only — checked at runtime
├── admin/              # super admin panel — separate subdomain
│   ├── layout.tsx      # admin sidebar with 2FA gate
│   ├── page.tsx        # admin dashboard
│   ├── inquiries/page.tsx
│   ├── verification/page.tsx
│   ├── users/page.tsx
│   ├── companies/page.tsx
│   ├── listings/page.tsx
│   ├── taxonomy/page.tsx
│   ├── announcements/page.tsx
│   ├── analytics/page.tsx
│   ├── audit/page.tsx
│   └── team/page.tsx
├── api/
│   ├── auth/[...nextauth]/route.ts  # NextAuth catch-all
│   ├── files/[...path]/route.ts      # authenticated file serving
│   └── webhooks/
│       └── chat/route.ts             # chat-provider webhook receiver
├── layout.tsx          # root layout (Inter font, theme, providers)
├── globals.css         # tailwind + Modern Dark CSS variables
└── middleware.ts       # route protection
```

### 3.2 Rendering strategy

- **Marketing pages:** SSR with `force-static` where possible. Pre-rendered at build time.
- **Cabinet pages:** mostly SSR with React Server Components. Interactive parts (forms, filters, chat embed) are Client Components.
- **Admin pages:** SSR + RSC. Admin queue uses streaming for fast initial paint.
- **Chat widget:** Client Component, loaded via the chat provider's React SDK. Lazy-loaded on the Inquiry Detail page only.

### 3.3 Authentication middleware

`src/middleware.ts` protects route groups:

- `(app)/*` — requires authenticated session. Redirects to `/login` otherwise.
- `admin/*` — requires authenticated session AND `role === 'ADMIN'` AND 2FA verified. Redirects to `/login` or `/admin/2fa` accordingly.
- `(marketing)/*` and `(auth)/*` — public.

## 4. Data Architecture

### 4.1 Prisma schema overview

All entities use `cuid()` primary keys, explicit foreign-key behavior, UTC timestamps, and explicit text-length annotations. Full schema lives in `prisma/schema.prisma`.

```prisma
// === ENUMS ===
enum UserRole         { ADVERTISER PUBLISHER ADMIN }
enum AdminSubrole     { OWNER MANAGER BROKER SUPPORT }
enum CompanyVerifStatus { PENDING APPROVED REJECTED NEEDS_INFO }
enum ChannelType      { PRODUCT_PLACEMENT IN_VIDEO_AD WEBSITE_BANNER TV RADIO OUTDOOR SOCIAL PODCAST PRINT INFLUENCER EVENT }
enum ListingStatus    { DRAFT ACTIVE PAUSED CLOSED }
enum InquiryStatus    { NEW ASSIGNED IN_PROGRESS AWAITING_PUBLISHER AWAITING_ADVERTISER CONFIRMED LOST CANCELLED }
enum ChatThreadSide   { ADVERTISER PUBLISHER }
enum NotificationType { INQUIRY_MESSAGE INQUIRY_STATUS VERIFICATION_RESULT LISTING_DECISION ADMIN_ASSIGN ADMIN_SLA_BREACH }

// === CORE ===
model User {
  id              String   @id @default(cuid())
  email           String   @unique
  emailVerified   DateTime?
  passwordHash    String
  name            String
  phone           String?
  role            UserRole
  adminSubrole    AdminSubrole?
  companyId       String?
  company         Company? @relation(fields: [companyId], references: [id], onDelete: Restrict)
  twoFactorEnabled Boolean @default(false)
  twoFactorSecret String?  // encrypted TOTP secret, admins only
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  lastLoginAt     DateTime?
  // NextAuth relations
  accounts        Account[]
  sessions        Session[]
}

model Company {
  id                   String   @id @default(cuid())
  name                 String
  legalName            String?
  taxId                String?
  type                 String?
  foundingYear         Int?
  country              String   @default("AM")
  address              String?  @db.Text
  logoUrl              String?
  verificationStatus   CompanyVerifStatus @default(PENDING)
  verifiedAt           DateTime?
  verifiedById         String?
  canAdvertise         Boolean @default(false)
  canPublish           Boolean @default(false)
  users                User[]
  listings             Listing[]
  // many-to-many via join tables for industries, channels, regions
  industries           CompanyIndustry[]
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}

model Listing {
  id                 String   @id @default(cuid())
  companyId          String
  company            Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  title              String
  channelType        ChannelType
  sourceChannelId    String?
  sourceChannel      SourceChannel? @relation(fields: [sourceChannelId], references: [id], onDelete: SetNull)
  availableFrom      DateTime
  availableTo        DateTime
  audienceDemographics Json?
  description        String   @db.Text
  status             ListingStatus @default(DRAFT)
  viewCount          Int      @default(0)
  inquiryCount       Int      @default(0)
  industryTargets    ListingIndustry[]
  inquiries          Inquiry[]
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  @@fulltext([title, description])
  @@index([status, channelType])
  @@index([availableFrom, availableTo])
}

model Inquiry {
  id                       String   @id @default(cuid())
  advertiserUserId         String
  advertiserUser           User     @relation("advertiserInquiries", fields: [advertiserUserId], references: [id], onDelete: Restrict)
  advertiserCompanyId      String
  advertiserCompany        Company  @relation("advertiserInquiriesCo", fields: [advertiserCompanyId], references: [id], onDelete: Restrict)
  publisherCompanyId       String
  publisherCompany         Company  @relation("publisherInquiriesCo", fields: [publisherCompanyId], references: [id], onDelete: Restrict)
  listingId                String?
  listing                  Listing? @relation(fields: [listingId], references: [id], onDelete: SetNull)
  assignedAdminId          String?
  assignedAdmin            User?    @relation("assignedInquiries", fields: [assignedAdminId], references: [id], onDelete: SetNull)
  status                   InquiryStatus @default(NEW)
  closeReason              String?  @db.Text
  slaDeadline              DateTime?
  advertiserChatThreadId   String?  // external ID from chat provider
  publisherChatThreadId    String?  // external ID from chat provider
  campaignGoal             String?  @db.Text
  desiredDateFrom          DateTime?
  desiredDateTo            DateTime?
  budgetRangeLow           Int?     // optional, private
  budgetRangeHigh          Int?
  notes                    String?  @db.Text
  notesInternal            InternalNote[]
  calls                    Call[]
  auditEntries             AuditEntry[]
  createdAt                DateTime @default(now())
  updatedAt                DateTime @updatedAt
  closedAt                 DateTime?
  @@index([status, assignedAdminId])
  @@index([slaDeadline])
}

model InternalNote {
  id              String   @id @default(cuid())
  inquiryId       String
  inquiry         Inquiry  @relation(fields: [inquiryId], references: [id], onDelete: Cascade)
  authorAdminId   String
  authorAdmin     User     @relation(fields: [authorAdminId], references: [id], onDelete: Restrict)
  body            String   @db.Text
  mentionedAdminIds Json?  // array of user IDs
  createdAt       DateTime @default(now())
}

model Call {
  id              String   @id @default(cuid())
  inquiryId       String
  inquiry         Inquiry  @relation(fields: [inquiryId], references: [id], onDelete: Cascade)
  side            ChatThreadSide
  adminId         String
  admin           User     @relation(fields: [adminId], references: [id], onDelete: Restrict)
  scheduledAt     DateTime?
  startedAt       DateTime?
  endedAt         DateTime?
  notes           String?  @db.Text
  createdAt       DateTime @default(now())
}

model Wishlist {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  listingId       String?
  listing         Listing? @relation(fields: [listingId], references: [id], onDelete: Cascade)
  publisherCompanyId String?
  publisherCompany Company? @relation(fields: [publisherCompanyId], references: [id], onDelete: Cascade)
  createdAt       DateTime @default(now())
  @@unique([userId, listingId])
  @@unique([userId, publisherCompanyId])
}

model Notification {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type            NotificationType
  title           String
  body            String?  @db.Text
  link            String?
  readAt          DateTime?
  createdAt       DateTime @default(now())
  @@index([userId, readAt])
}

model VerificationRequest {
  id              String   @id @default(cuid())
  companyId       String
  company         Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  submittedAt     DateTime @default(now())
  documents       Json?    // array of {path, mimeType, originalName}
  reviewedByAdminId String?
  reviewedAt      DateTime?
  decision        CompanyVerifStatus?
  decisionReason  String?  @db.Text
}

model AuditEntry {
  id              String   @id @default(cuid())
  actorAdminId    String
  actorAdmin      User     @relation(fields: [actorAdminId], references: [id], onDelete: Restrict)
  action          String   // e.g., "INQUIRY_STATUS_CHANGE", "USER_SUSPEND"
  entityType      String   // e.g., "Inquiry", "User", "Company"
  entityId        String
  before          Json?
  after           Json?
  createdAt       DateTime @default(now())
  @@index([actorAdminId, createdAt])
  @@index([entityType, entityId])
}

model Announcement {
  id              String   @id @default(cuid())
  title           String
  body            String   @db.Text
  audience        String   // "ALL" | "ADVERTISER" | "PUBLISHER" | "CUSTOM"
  customUserIds   Json?
  startsAt        DateTime?
  endsAt          DateTime?
  createdById     String
  createdAt       DateTime @default(now())
}

model FeaturedListing {
  id              String   @id @default(cuid())
  listingId       String
  listing         Listing  @relation(fields: [listingId], references: [id], onDelete: Cascade)
  position        Int
  startsAt        DateTime?
  endsAt          DateTime?
  createdById     String
  createdAt       DateTime @default(now())
  @@unique([listingId, startsAt])
}

model SourceChannel {
  id              String   @id @default(cuid())
  name            String
  type            ChannelType
  ownerCompanyId  String?
  listings        Listing[]
}

model Industry {
  id              String   @id @default(cuid())
  name            String   @unique
  parentId        String?
  parent          Industry? @relation("IndustryHierarchy", fields: [parentId], references: [id], onDelete: SetNull)
  children        Industry[] @relation("IndustryHierarchy")
  archived        Boolean  @default(false)
  companyLink     CompanyIndustry[]
  listingLink     ListingIndustry[]
}

// join tables
model CompanyIndustry {
  companyId  String
  industryId String
  company    Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  industry   Industry @relation(fields: [industryId], references: [id], onDelete: Cascade)
  @@id([companyId, industryId])
}

model ListingIndustry {
  listingId  String
  industryId String
  listing    Listing  @relation(fields: [listingId], references: [id], onDelete: Cascade)
  industry   Industry @relation(fields: [industryId], references: [id], onDelete: Cascade)
  @@id([listingId, industryId])
}

// === NEXTAUTH ===
model Account {
  id                String  @id @default(cuid())
  userId            String
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  type              String
  provider          String
  providerAccountId String
  // ... standard NextAuth fields
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expires      DateTime
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}
```

### 4.2 Schema conventions

- **Primary keys:** `String @id @default(cuid())` — shorter than UUID, sortable by creation time, MySQL-friendly.
- **Text fields:** Default `String` is `VARCHAR(191)` in MySQL — too short for descriptions. Always annotate with `@db.Text` for descriptions, `@db.LongText` for chat-history-style data (not needed in MVP since chat is external).
- **JSON columns:** Use `Json` type for unstructured data (audience demographics, audit before/after snapshots, mentioned admin IDs).
- **Enums:** Defined as Prisma enums; stored as `VARCHAR` with application-level check constraint.
- **Foreign keys:** Always declare `onDelete: Cascade` (when child should die with parent) or `onDelete: Restrict` (when delete should fail) or `onDelete: SetNull` (when child should detach but survive). Never leave default.
- **Timestamps:** `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt` on every persistent entity. UTC always.
- **Indexes:** Add `@@index([col1, col2])` on every column used in `WHERE` or `ORDER BY` of common queries. Add `@@fulltext` on text columns that support keyword search.

### 4.3 Migration workflow

1. Edit `prisma/schema.prisma` locally.
2. Run `npx prisma migrate dev --name <descriptive_name>` to generate the migration file and apply locally.
3. Inspect the generated SQL in `prisma/migrations/<timestamp>_<name>/migration.sql`.
4. Commit both the schema change and the migration file to Git.
5. After deploy on Hostinger, SSH in and run `npx prisma migrate deploy` to apply pending migrations to the production database.

**Rule:** Never run `prisma migrate dev` against production. Production always uses `prisma migrate deploy`.

## 5. Authentication & Authorization

### 5.1 Auth flow

```
Visitor → /register
  └→ submit form (email, password, role)
  └→ Server Action: validate (Zod) → hash password (bcrypt 12 rounds) → create User row → send 6-digit code via Resend
  └→ Redirect to /verify
  └→ Verify code → mark emailVerified → redirect to /company-profile

Visitor → /login
  └→ submit form (email, password)
  └→ NextAuth Credentials provider: verify password → create JWT session (24h)
  └→ Redirect to /dashboard (advertiser/publisher) or /admin (admin)

Admin → /admin/login
  └→ same as /login but additionally:
  └→ Check role === ADMIN, redirect to /admin/2fa if 2FA not verified for this session
  └→ TOTP code prompt → verify → mark session as 2fa-passed
  └→ Redirect to /admin
```

### 5.2 Authorization helpers

All in `src/lib/auth-helpers.ts`:

```typescript
async function requireSession(): Promise<Session> { /* throws if no session */ }
async function requireRole(role: UserRole | UserRole[]): Promise<Session> { /* throws if role mismatch */ }
async function requireAdminSubrole(subrole: AdminSubrole): Promise<Session> { /* throws if admin sub-role insufficient */ }
async function requireOwnInquiry(inquiryId: string): Promise<Inquiry> { /* throws if inquiry not owned */ }
async function requireOwnCompany(companyId: string): Promise<Company> { /* throws if user not in company */ }
async function require2FA(): Promise<Session> { /* throws if admin session not 2fa-passed */ }
```

Every Server Action and protected API route starts with one of these.

### 5.3 Password & TOTP

- **Passwords:** bcrypt with 12 rounds. Stored as `passwordHash` on User.
- **TOTP:** Admins only. Secret generated with `otplib`, stored encrypted using a key from `TWOFACTOR_ENCRYPTION_KEY` env var. QR code generated for authenticator app setup.
- **Password reset:** NextAuth's `VerificationToken` table holds reset tokens with 24-hour expiry, single-use.
- **Email verification:** 6-digit codes stored in `VerificationToken` table with 10-minute expiry, resendable after 60s cooldown.

## 6. API Design

### 6.1 Server Actions

Internal mutations are colocated with the components that trigger them. Example:

```typescript
// src/app/(app)/inquiries/new/page.tsx
'use client'
import { submitInquiry } from './actions'

// src/app/(app)/inquiries/new/actions.ts
'use server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth-helpers'
import { db } from '@/lib/db'

const InquirySchema = z.object({
  listingId: z.string().cuid(),
  campaignGoal: z.string().min(10).max(1000),
  // ...
})

export async function submitInquiry(input: unknown) {
  const session = await requireRole('ADVERTISER')
  const data = InquirySchema.parse(input)
  // application-level authorization: company must be verified
  if (session.user.company.verificationStatus !== 'APPROVED') throw new Error('NOT_VERIFIED')
  return db.inquiry.create({ data: { ...data, advertiserUserId: session.user.id, advertiserCompanyId: session.user.companyId } })
}
```

### 6.2 API Routes

Only for external contracts:

- `/api/auth/[...nextauth]` — NextAuth handlers (login, callback, session).
- `/api/files/[...path]` — file streaming with auth + entity ownership check.
- `/api/webhooks/chat` — chat-provider event receiver. HMAC-signed for security.

## 7. File Storage

### 7.1 Layout

```
<project root>/storage/uploads/
├── companies/
│   └── <companyId>/
│       ├── logo.png
│       └── verification/
│           └── <random>.pdf
├── listings/
│   └── <listingId>/
│       └── <random>.pdf  # publisher attachments
```

### 7.2 Serving

- **Public files (logos):** also copied to `public/uploads/logos/<companyId>.png` for direct serving via Hostinger's static-asset handler. Faster, cacheable, no auth check needed.
- **Private files (verification docs, listing attachments):** served only via `/api/files/[...path]` after the requester's session is checked AND the requester has authorization to view the entity that owns the file. `Cache-Control: private, max-age=3600`.

### 7.3 Upload helper

`src/lib/storage.ts`:

```typescript
export async function saveUpload(
  file: File,
  entityType: 'companies' | 'listings',
  entityId: string,
  subfolder?: string
): Promise<{ path: string; size: number }> {
  // validate mime type from MIME_ALLOWLIST
  // validate size <= 10 MB
  // generate random filename
  // write to storage/uploads/<entityType>/<entityId>/[subfolder/]<random>.<ext>
  // return relative path for DB storage
}
```

## 8. Integration Architecture

### 8.1 Chat provider (TBD)

- **Selection criteria:** Free tier covering 130+ MAU; embeddable React widget; webhook for new-message events; two-party private thread support.
- **Candidates:** Stream Chat (Maker plan limits to 25 MAU — too small), Sendbird (100 MAU on Developer plan — borderline), Talk.js (production requires paid — rules it out for MVP), CometChat (300 MAU on free — best fit at first look). Evaluation in week 8.
- **Integration points:**
  - On Inquiry creation: call provider API to create two threads (advertiser-admin, admin-publisher).
  - Render provider's widget in the inquiry detail page, scoped to the appropriate thread.
  - Receive webhook events at `/api/webhooks/chat` for: new message (trigger our Notification + email digest), read receipt (track first response time for SLA metrics).
- **Failure mode:** If provider is down, the rest of the platform continues to function. Chat-dependent UI shows a non-blocking error state.

### 8.2 Resend (email)

- All transactional email sent via Resend SDK from `src/lib/email.ts`.
- Templates as React Email components in `emails/`:
  - `WelcomeEmail` (after registration)
  - `VerifyEmail` (6-digit code)
  - `ResetPasswordEmail`
  - `VerificationApprovedEmail`
  - `VerificationRejectedEmail`
  - `InquiryStatusEmail` (status changes)
  - `DailyDigestEmail` (cron-fired)
- Email-send wrapped in `tryEmailSend(...)` helper that catches Resend errors, logs to Sentry, and persists a `Notification` row regardless so in-app notification fires even if email fails.

### 8.3 Sentry

- `@sentry/nextjs` configured at root for server + client.
- DSN from `SENTRY_DSN` env var.
- Capture unhandled errors, performance traces on critical paths.
- Source maps uploaded during build.

### 8.4 PostHog

- `posthog-js` initialized in `src/app/layout.tsx`.
- Auto-capture page views.
- Manual capture for: inquiry submitted, status change, listing created, admin claim, deal confirmed.

## 9. Security Architecture

### 9.1 Defense layers

1. **Transport:** HTTPS via Let's Encrypt (Hostinger auto-renews). HTTP redirects to HTTPS.
2. **Input:** Every form validated with Zod schemas on both client and server. Server-side validation is the source of truth.
3. **Authentication:** NextAuth Credentials with bcrypt-hashed passwords. JWT sessions.
4. **Authorization:** Application-level checks in every protected handler.
5. **Rate limiting:** Token-bucket per-IP in-memory (no Redis on Hostinger). 10 auth attempts / 5 min / IP. 20 inquiry submissions / hour / advertiser.
6. **2FA:** TOTP for admins. Mandatory.
7. **Audit log:** Every admin write logs to `AuditEntry`. Append-only at app level (no UPDATE/DELETE exposed).
8. **File uploads:** MIME-type allowlist (JPG/PNG/WEBP/PDF), 10 MB limit, served with authorization check.

### 9.2 Secrets management

- All secrets in environment variables, set in Hostinger panel (Node.js app → Environment Variables). Not in source control.
- `.env.example` documents every required variable.
- `NEXTAUTH_SECRET` rotated annually.
- `TWOFACTOR_ENCRYPTION_KEY` rotated only on compromise (rotation requires re-enrolling all admins).

### 9.3 Backup & DR

- Hostinger Business daily filesystem + database snapshots. Retained 30 days.
- Quarterly restore drill (manual) — restore to staging, verify integrity.
- RPO ≤ 24h, RTO ≤ 24h.

## 10. Deployment Architecture

### 10.1 Deploy pipeline

```
Developer → git push → main branch
                         │
                         ▼
              Hostinger Git deployment (auto-pull)
                         │
                         ▼
              SSH session (manual, one-time per migration):
                ├─ npm install
                ├─ npx prisma generate
                ├─ npx prisma migrate deploy  ← only on schema change
                ├─ npm run build
                ├─ cp -r public .next/standalone/
                ├─ cp -r .next/static .next/standalone/.next/
                └─ restart Node.js app from hPanel
```

### 10.2 Environment variables (production)

Documented in `.env.example`. Required:

- `DATABASE_URL=mysql://USER:PASS@127.0.0.1:3306/DBNAME`
- `NEXTAUTH_URL=https://yourdomain.com`
- `NEXTAUTH_SECRET=<openssl rand -base64 32>`
- `TWOFACTOR_ENCRYPTION_KEY=<openssl rand -base64 32>`
- `RESEND_API_KEY=...`
- `EMAIL_FROM=noreply@yourdomain.com`
- `SENTRY_DSN=...`
- `NEXT_PUBLIC_POSTHOG_KEY=...`
- `NEXT_PUBLIC_POSTHOG_HOST=https://eu.posthog.com`
- Chat provider keys (TBD)

### 10.3 Rollback

Hostinger's daily filesystem snapshots provide rollback for code. Database rollback for forward-only migrations requires manual `prisma migrate resolve` against a backed-up snapshot — practical at MVP scale but documented in `docs/runbook-rollback.md`.

## 11. Performance & Caching

- **Static marketing pages:** `force-static` in App Router, served from build artifacts.
- **Cabinet/admin pages:** SSR, no caching layer in MVP. Add HTTP cache headers per-route as needed in Phase 2 if observability shows hot paths.
- **Database query performance:** Critical indexes declared explicitly in Prisma schema. Slow-query log monitored manually.
- **No CDN for app-served pages** (Hostinger serves directly). Static `public/` assets benefit from Hostinger's built-in CDN.

## 12. Observability

### 12.1 What we collect

- **Errors:** Sentry — unhandled exceptions on server and client, with session context (user ID, role, route).
- **Performance:** Sentry traces on critical Server Actions and pages. Sample rate 25% in production.
- **Product events:** PostHog — page views, inquiry submissions, status changes, listing creations, admin actions.
- **Operational:** External uptime monitor (free tier — UptimeRobot or similar) pinging the homepage every 5 minutes.

### 12.2 What we don't collect (yet)

- Distributed tracing (single-process app, not needed).
- Server-side log aggregation (Hostinger app logs accessible via SSH).

## 13. Folder Structure

```
<project root>/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
│   ├── images/
│   └── uploads/logos/        # public company logos
├── storage/
│   └── uploads/               # private files, gitignored
├── src/
│   ├── app/                   # Next.js App Router
│   │   └── ... (see §3.1)
│   ├── components/
│   │   ├── ui/                # shadcn primitives
│   │   ├── marketing/
│   │   ├── app/
│   │   ├── admin/
│   │   └── shared/
│   ├── lib/
│   │   ├── auth.ts             # NextAuth config
│   │   ├── auth-helpers.ts     # requireSession etc
│   │   ├── db.ts                # Prisma singleton
│   │   ├── storage.ts           # file upload helper
│   │   ├── email.ts             # Resend wrapper
│   │   ├── chat.ts              # chat-provider abstraction
│   │   ├── rate-limit.ts        # token-bucket
│   │   ├── audit.ts             # audit-log helper
│   │   └── utils.ts             # cn() etc
│   ├── types/
│   └── middleware.ts
├── emails/                   # React Email templates
├── docs/
│   ├── CONTRIBUTING.md
│   ├── DEPLOY-HOSTINGER.md
│   ├── api.md
│   └── runbook-rollback.md
├── tests/
│   └── e2e/                   # Playwright
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## 14. Testing Strategy

- **Unit tests:** Not pursued in MVP except for `lib/` helpers where bugs would be invisible (rate-limit, auth-helpers, storage path generation). Vitest.
- **E2E tests:** Playwright covers three critical paths:
  1. Registration → email verification → company profile → wait for admin approval.
  2. Browse catalog → open listing → submit inquiry → see status in My Inquiries.
  3. Admin login → 2FA → claim inquiry from team queue → change status → log call.
- **Integration tests:** Skipped in MVP. Prisma schema changes are the riskiest area; a Playwright run after each migration catches most regressions.
- **CI:** GitHub Actions runs ESLint, TypeScript check, Vitest, Playwright on every PR. Required green before merge.

## 15. Future Considerations

### Phase 2 architectural changes

- **Real-time updates** for admin queue and notification bell — likely via Pusher Channels free tier or short-polling, depending on observed admin pain points.
- **Payment processing** for brokerage commissions — Stripe Connect or local Armenian processor; introduces PCI scope.
- **Reviews & ratings** — adds `Review` entity, public visibility on company profiles.
- **WebRTC voice/video** — Daily.co or Twilio Voice. Introduces media-server dependency.

### Phase 3 architectural changes

- **Mobile apps** — separate React Native codebase consuming the same API surface. Requires extracting API into versioned `/api/v1/*` namespace.
- **AI-assisted broker tooling** — Claude API or OpenAI for: suggest publishers per inquiry, draft outreach copy, summarize conversation history. Adds an LLM service dependency and prompt-management discipline.
- **Multi-language** — `next-intl`. Inter font already supports AM/RU/EN, no font change needed.
- **Multi-region expansion** — single MySQL instance is sufficient until ~100K active users. Postpone any sharding/replication conversation.

## 16. Open Questions

These need resolution before specific phases:

1. **Chat provider selection** — by week 8 of Phase 1. Owner: Hayk. Decision will be appended as a new ADR (ADR-010+).
2. **Domain choice for `admin.[domain]`** — subdomain on the same Hostinger account, or separate domain? Owner: Hayk. Cosmetic decision, affects DNS only.
3. **TOTP encryption key rotation policy** — manual annual rotation is documented; should it be automated in Phase 2? Owner: Winston, deferrable.

---

**End of architecture document.**
