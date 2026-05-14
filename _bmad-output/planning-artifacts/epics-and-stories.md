---
workflowType: 'epics-and-stories'
project_name: 'Advertising Platform'
author: 'John (Product Manager)'
date: '2026-05-13'
inputDocuments:
  - 'prd.md'
  - 'architecture.md'
  - 'ux-design.md'
status: 'COMPLETE'
totalEpics: 10
totalStories: 62
---

# Epics & Stories — Advertising Platform

**Author:** John (BMAD Product Manager)
**Date:** 2026-05-13
**Source:** `prd.md` (80 FRs), `architecture.md` (Prisma schema, auth model), `ux-design.md` (wireframes, interaction patterns)

This document is the **dev-ready work breakdown** for Amelia (developer). Every story is independently shippable, has acceptance criteria, traces back to the PRD, and respects architectural and UX decisions.

## Estimation legend

- **S** ≈ 0.5–1 day of focused work
- **M** ≈ 1–2 days
- **L** ≈ 2–4 days
- **XL** ≈ ≥ 5 days (consider splitting before estimation)

## Phase placement

Stories are tagged with target Phase (Phase 1: weeks 1–4 Foundations, Phase 2: weeks 5–8 Marketplace Core, Phase 3: weeks 9–12 Inquiry Workflow, Phase 4: weeks 13–16 Polish & Beta). Total ~62 stories across ~12 working weeks of dev — aggressive but feasible at solo-dev pace with AI assistance.

## Epic overview

| ID | Epic | Stories | Effort | Phase | FRs covered |
|---|---|---|---|---|---|
| E-01 | Foundations & Public Site | 5 | M | 1 | 015–020 + non-FR scaffolding |
| E-02 | Authentication | 6 | L | 1 | 001–008 |
| E-03 | Company Profile & Verification | 7 | L | 2 | 009–014, 077–078 |
| E-04 | Publisher Listings | 6 | M | 2 | 021–025, 079–080 |
| E-05 | Advertiser Inquiries & Wishlist | 7 | L | 2–3 | 026–030, 039–040 |
| E-06 | Notifications | 4 | M | 3 | 041–044 |
| E-07 | Third-Party Chat Integration | 5 | L | 3 | 031–036 |
| E-08 | Admin Auth & Dashboard | 4 | M | 3 | 045–047 |
| E-09 | Admin Inquiry Queue & Mediation | 9 | XL | 3–4 | 037–038, 048–061 |
| E-10 | Platform Administration & Analytics | 9 | XL | 4 | 062–076 |

## Dependency graph

```
E-01 (Foundations)
  └→ E-02 (Auth)
        └→ E-03 (Company Verification)
              └→ E-04 (Publisher Listings)
              │     └→ E-05 (Advertiser Inquiries)
              │           └→ E-07 (Chat Integration)
              │                 └→ E-09 (Admin Inquiry Mediation)
              └→ E-08 (Admin Auth) → E-09 → E-10
              └→ E-06 (Notifications) parallel after E-02
```

Critical path: E-01 → E-02 → E-03 → E-04 → E-05 → E-07 → E-09. Other epics fold in around.

---

## E-01 — Foundations & Public Site

**Goal:** Project scaffolded on Hostinger Node.js + MySQL. Marketing pages live with Modern Dark brand. Public catalog browseable without auth.

**Linked Journeys:** All journeys depend on this.
**Linked FRs:** 015–020 + base infrastructure not in FRs.

### S-01.1 — Project scaffold on Hostinger Node.js + Prisma + MySQL

- **As** Amelia, **I want** the Next.js 14 + TypeScript + Tailwind + shadcn/ui project scaffolded with `output: 'standalone'`, Prisma initialized for MySQL, and `.env.example` documenting all required variables, **so that** I can deploy a minimal hello-world page to Hostinger.
- **Acceptance criteria:**
  - `npm run build` produces `.next/standalone/server.js` without errors.
  - Prisma schema defines User/Company stubs with `cuid()` primary keys.
  - `.env.example` lists all keys from architecture.md §10.2.
  - Tailwind + shadcn/ui initialized with Modern Dark CSS variables (background `#0A0A0F`, accent `#BEFC42`, etc.).
  - Inter font loaded via `next/font/google`.
  - A bare `/` route renders "Advertising Platform" in Modern Dark with the lime period.
- **Effort:** M
- **Depends on:** —
- **Phase:** 1
- **Notes:** Follow `Claude_Code_Kickoff.md` Stage 3 prompt as a starting point. Use shadcn components: button, input, card.

### S-01.2 — Hostinger deployment + Git deploy pipeline

- **As** Amelia, **I want** the GitHub repo connected to Hostinger Git deployment with documented SSH steps for `prisma migrate deploy` + `npm run build`, **so that** every push to `main` reaches production with one SSH session.
- **Acceptance criteria:**
  - GitHub repo created and connected to Hostinger Git in hPanel.
  - `docs/DEPLOY-HOSTINGER.md` documents the full deploy procedure including env var setup and `prisma migrate deploy`.
  - First production deploy from `main` is successful — Hostinger domain serves the bare homepage.
  - SSL/HTTPS confirmed working (Hostinger Let's Encrypt).
- **Effort:** M
- **Depends on:** S-01.1
- **Phase:** 1

### S-01.3 — Marketing pages: Homepage, About, How It Works (Advertisers / Publishers)

- **As** a visitor, **I want** to read pages that explain what the platform does and how it works, **so that** I can decide whether to register.
- **Acceptance criteria:**
  - `/` renders the homepage matching ux-design §6.1 (hero, featured-listings strip with mock data, How-it-works strip, footer).
  - `/how-it-works/advertisers` and `/how-it-works/publishers` render persona-specific content.
  - `/about` renders simple About content.
  - Lime accent appears at most 3 times per page (verified by visual review).
  - Motion entrance on hero text; GSAP scroll-parallax on hero background.
  - All copy follows tone-of-voice (no "We're excited" / "Awesome").
- **Effort:** L
- **Depends on:** S-01.1
- **Phase:** 1
- **Notes:** Use `Featured Listings` with mock data in this story; real data wires in S-04.x.

### S-01.4 — Legal pages: ToS, Privacy Policy, FAQ, Contact

- **As** a visitor or registered user, **I want** to read the platform's Terms of Service, Privacy Policy, and FAQ, **so that** I understand the rules and can answer my own questions.
- **Acceptance criteria:**
  - `/terms`, `/privacy`, `/faq`, `/contact` render with placeholder legal content + real FAQ entries (registration, verification, inquiries).
  - All pages accessible from footer.
  - 404 page implemented with brand-voice copy ("That page doesn't exist. Browse the catalog.").
- **Effort:** S
- **Depends on:** S-01.1
- **Phase:** 1

### S-01.5 — Public catalog browsing (no auth required)

- **As** a visitor, **I want** to browse, search, filter, sort, and paginate the public catalog of active publisher listings without logging in, **so that** I can evaluate the platform before registering.
- **Acceptance criteria:** [FR-015, 016, 017, 018, 019, 020]
  - `/catalog` lists all `Listing.status = ACTIVE` rows with channel type, title, publisher name, availability dates, audience demographics — **no prices shown**.
  - Filters work: channel type, industry, region, audience size range, availability date range.
  - Keyword search uses MySQL FULLTEXT on `Listing.title + description + SourceChannel.name`.
  - Sort options: newest, soonest availability. Newest is default.
  - Pagination: 24 listings/page.
  - Logged-out visitors see "Request Information" CTA that prompts login (modal with link to register).
  - Empty state for filtered no-results matches ux-design §7.2.
- **Effort:** L
- **Depends on:** S-01.1, S-04.1 (Listing model)
- **Phase:** 2 (after listing model exists)

### S-01.6 — Homepage Our Partners strip

- **As** a visitor on the homepage, **I want** to see logos of the publishers our team works with, **so that** I trust the platform has real inventory before I register.
- **Acceptance criteria:**
  - Homepage renders an "Our partners" section below "Advertising opportunities" and above "How it works".
  - **Phase 1 (placeholder):** 6-slot grid, each slot rendered as a dashed-border tile with the copy "Onboarding — partner reveal at launch." No fake logos. Honest about pre-launch state per brand voice §2 "Confidence over reassurance".
  - **Phase 4 (data-driven):** queries `Company` where `verificationStatus = APPROVED AND role-derived-from-users includes PUBLISHER AND logoUrl IS NOT NULL`, ordered by `verifiedAt DESC`, shows up to 12 logos. Each logo links to `/publishers/<id>` once the public publisher page lands.
  - Section title and CTA copy stay neutral; no superlatives ("best", "top", "leading").
  - Lime accent count on the page stays ≤3 (per S-01.3 brand rule).
- **Effort:** S (Phase 1 placeholder), M (Phase 4 data wiring)
- **Depends on:** S-01.3 (homepage shell). Phase 4 wiring also depends on `/publishers/<id>` route (TBD story in E-04 or E-10).
- **Phase:** 1 for placeholder, 4 for data wiring.

### S-01.7 — Homepage Our Works strip

- **As** a visitor on the homepage, **I want** to see case studies of past brokered deals, **so that** I understand what success on the platform looks like.
- **Acceptance criteria:**
  - Homepage renders a "Our works" section below "Our partners" and above "How it works".
  - **Phase 1 (placeholder):** single honest panel — copy "First case studies publish after our pilot deals close. We won't fake them." No mock case-study cards.
  - **Phase 4 (data-driven):** 3-card grid sourced from a new `CaseStudy` table (admin-curated; not auto-pulled from inquiries to keep editorial control). Each card has title, publisher name, channel type tag, one-paragraph teaser, link to detail page.
  - Section title and copy stay neutral; case studies require explicit consent from both advertiser and publisher before publication (privacy + ToS).
- **Effort:** S (Phase 1 placeholder), L (Phase 4 — new model + admin curator + detail page)
- **Depends on:** S-01.3. Phase 4 depends on a new admin curator story (TBD).
- **Phase:** 1 for placeholder, 4 for the full feature.
- **Notes:** Considered auto-generating cards from `Inquiry.status = CONFIRMED` rows but rejected — editorial / consent gates are too important to automate. Always admin-curated.

---

## E-02 — Authentication

**Goal:** Users register, verify email, log in, log out, reset passwords. NextAuth + Prisma Adapter + Credentials provider + JWT sessions.

**Linked Journeys:** 1, 2, 3, 4 (all require auth).
**Linked FRs:** 001–008.

### S-02.1 — Multi-step registration with role selection

- **As** an unregistered visitor, **I want** to register an account by choosing a role and providing personal info, **so that** I can start using the platform.
- **Acceptance criteria:** [FR-001]
  - `/register` step 1: choose Advertiser or Publisher via two cards.
  - `/register/personal` step 2: full name, email, phone, password (≥8 chars), ToS+Privacy checkbox.
  - Server Action `registerUser`: validates with Zod, hashes password with bcrypt 12 rounds, creates User row with `emailVerified: null` and chosen role.
  - Sends 6-digit verification email via Resend (template: VerifyEmail).
  - Redirects to `/verify`.
  - Existing email returns inline error "An account with this email already exists. Try logging in."
- **Effort:** M
- **Depends on:** S-01.1
- **Phase:** 1

### S-02.2 — Email verification with 6-digit code

- **As** a newly registered user, **I want** to verify my email with a 6-digit code, **so that** my account is confirmed.
- **Acceptance criteria:** [FR-002, 003]
  - `/verify` accepts 6-digit input. On submit, server validates against `VerificationToken` row.
  - Code expires after 10 minutes — expired codes return "Code expired. Request a new one."
  - Resend button enabled after 60-second countdown.
  - Successful verification sets `User.emailVerified = now()` and redirects to `/company-profile` (step 3 of onboarding).
- **Effort:** M
- **Depends on:** S-02.1
- **Phase:** 1

### S-02.3 — Login with NextAuth Credentials provider

- **As** a verified user, **I want** to log in with email and password, **so that** I can access my cabinet.
- **Acceptance criteria:** [FR-005]
  - `/login` form: email, password, "Forgot password" link.
  - NextAuth Credentials provider verifies bcrypt hash, returns JWT session.
  - Successful login redirects: advertisers/publishers to `/dashboard`, admins to `/admin` (with 2FA gate per E-08).
  - Failed login shows generic "Email or password is wrong." (no enumeration).
  - Rate limiting: 10 failed attempts per IP per 5 minutes — see NFR-014.
- **Effort:** M
- **Depends on:** S-02.2, S-01.1
- **Phase:** 1

### S-02.4 — Logout & session timeout

- **As** a logged-in user, **I want** to log out manually or have my session expire automatically after 30 minutes of inactivity, **so that** my account stays secure on shared computers.
- **Acceptance criteria:** [FR-004, 006, NFR-018]
  - Logout button in user menu calls NextAuth signOut.
  - JWT session expires after 30 minutes of inactivity (sliding window).
  - Expired session redirects to `/login` with `?expired=1` flash.
- **Effort:** S
- **Depends on:** S-02.3
- **Phase:** 1

### S-02.5 — Forgot password and reset link

- **As** a user who forgot my password, **I want** to receive an email with a reset link and set a new password, **so that** I can regain access.
- **Acceptance criteria:** [FR-007, NFR-021]
  - `/forgot-password` accepts email. Always returns generic success message ("If that email exists, we sent a link.") to prevent enumeration.
  - Reset link expires after 24 hours, single-use.
  - `/reset-password?token=...` accepts new password + confirm. Validates token, updates `passwordHash`, invalidates token.
- **Effort:** M
- **Depends on:** S-02.3
- **Phase:** 1

### S-02.6 — Change password (logged in)

- **As** a logged-in user, **I want** to change my password from settings, **so that** I can rotate it without going through forgot-password flow.
- **Acceptance criteria:** [FR-008]
  - `/settings/security` form: current password, new password, confirm new password.
  - Server verifies current password before updating.
- **Effort:** S
- **Depends on:** S-02.3
- **Phase:** 2

---

## E-03 — Company Profile & Verification

**Goal:** Users create company profiles, submit for verification. Admins review queue and approve / reject / request more info. Unverified accounts can browse but cannot submit inquiries or list inventory.

**Linked Journeys:** 1, 2, 3.
**Linked FRs:** 009–014, 077, 078.

### S-03.1 — Company profile creation form

- **As** a newly verified user, **I want** to fill in my company info (legal name, tax ID, country, address, industries, channels, logo), **so that** I can submit for verification.
- **Acceptance criteria:** [FR-009]
  - `/company-profile` step 3 of registration: form with all fields per ux-design §5.2.
  - Industries selection: multi-select from Industry table.
  - Channels of interest (advertiser) or channels owned (publisher): checkbox grid.
  - Logo upload: optional, JPG/PNG/WEBP, ≤2 MB, saved to `storage/uploads/companies/<companyId>/logo.<ext>`.
  - Server Action creates Company row with `verificationStatus: PENDING`, links to User, marks `canAdvertise` or `canPublish` based on role.
- **Effort:** L
- **Depends on:** S-02.2, S-10.1 (Industry/Channel taxonomy)
- **Phase:** 2
- **Notes:** Use react-hook-form + Zod resolver. Use shadcn Form components.

### S-03.2 — Submit for verification with optional documents

- **As** a user with a complete company profile, **I want** to submit it for verification with optional supporting documents, **so that** I can unlock full platform access.
- **Acceptance criteria:** [FR-010, 078]
  - Submit button creates `VerificationRequest` row with `submittedAt`, `documents` (array of `{path, mimeType, originalName}`).
  - Document upload: drag-and-drop, up to 5 files, ≤10 MB each, MIME allowlist (PDF, JPG, PNG, WEBP).
  - Files saved to `storage/uploads/companies/<companyId>/verification/<random>.<ext>`.
  - Confirmation screen: "Submitted for verification. We'll come back within 1 business day."
- **Effort:** M
- **Depends on:** S-03.1, S-storage helpers
- **Phase:** 2

### S-03.3 — Unverified account restrictions

- **As** the platform, **I want** to block unverified users from submitting inquiries or creating listings, **so that** we only transact with verified companies.
- **Acceptance criteria:** [FR-011]
  - Catalog and listing-detail pages remain browsable.
  - "Request Information" CTA on listing detail: if `Company.verificationStatus !== APPROVED`, button is disabled with tooltip "Pending verification. Resubmit if you've made changes." (links to `/company-profile/status`).
  - Publisher "New Listing" CTA: same gating.
  - Server Action handlers reject with HTTP 403 if attempted via direct API.
- **Effort:** S
- **Depends on:** S-03.1, S-01.5 (catalog)
- **Phase:** 2

### S-03.4 — Verification result email

- **As** a user, **I want** to receive an email when my verification decision is made, **so that** I know when I can start using the platform.
- **Acceptance criteria:** [FR-012]
  - On `verificationStatus` change, Resend sends VerificationApprovedEmail or VerificationRejectedEmail (with reason if rejected).
  - Also creates a `Notification` row of type `VERIFICATION_RESULT` for in-app display.
- **Effort:** S
- **Depends on:** S-03.2, S-06.1 (email infra)
- **Phase:** 2

### S-03.5 — Admin verification queue + detail

- **As** an admin (Owner / Manager), **I want** to see all pending verifications and review each one, **so that** I can approve, reject (with reason), or request more info.
- **Acceptance criteria:**
  - `/admin/verifications` lists all `VerificationRequest` rows where `decision IS NULL`, sorted oldest first.
  - Click opens `/admin/verifications/:id`: shows submitted company data + document previews (PDF inline preview, image thumbnails).
  - Three actions: [Approve] / [Reject] / [Request More Info].
  - Reject and Request More Info open a modal for capturing reason text.
  - Approve sets `Company.verificationStatus = APPROVED`, `verifiedAt = now()`, `verifiedById = admin.id`, plus `canAdvertise / canPublish` based on role.
  - Reject sets status to `REJECTED` with `decisionReason`.
  - All actions create `AuditEntry` rows.
- **Effort:** L
- **Depends on:** S-03.2, S-08.1 (admin auth), S-12.x (audit log)
- **Phase:** 2
- **Deferred from MVP:** generic `AuditEntry` table lands in S-12.x. For now the decision audit lives on the `VerificationRequest` row itself (`decision`, `decisionReason`, `reviewedAt`, `reviewedByAdminId`) — enough for "who decided what and why" without a second table.
- **Also adds:** private-doc serving route at `/admin/files/[...path]` (admin + 2FA-gated) — needed to preview PDFs/images stored in `storage/uploads/companies/<id>/verification/`. Not a separate story; covered here because the queue is useless without document previews.

### S-03.6 — Resubmit after rejection

- **As** a user whose verification was rejected, **I want** to update my profile and resubmit once, **so that** I can correct any issues.
- **Acceptance criteria:** [FR-013]
  - User in `REJECTED` status sees a banner on their dashboard: "Verification rejected: {reason}. [Update and resubmit]."
  - Resubmit creates a new `VerificationRequest` row (keep history).
  - Limit to one resubmission cycle; subsequent rejection requires admin manual unlock (deferred to manual handling).
- **Effort:** M
- **Depends on:** S-03.5
- **Phase:** 2
- **Status:** Shipped. Dashboard banner already existed (REJECTED, NEEDS_INFO, PENDING-with-request, PENDING-no-request, APPROVED). The /company-profile/verification page now also surfaces the previous review reason for both REJECTED and NEEDS_INFO. The resubmit Server Action creates a fresh VerificationRequest row (history preserved) and flips Company.verificationStatus back to PENDING.
- **Out of scope:** the "one resubmission cycle" hard limit — AC explicitly defers it to manual handling. Admins can refuse repeat applicants from the queue if needed.

### S-03.7 — Edit company profile after verification

- **As** a verified user, **I want** to edit my company profile (name, address, logo, industries), **so that** it stays current.
- **Acceptance criteria:** [FR-014]
  - `/settings/company` form prefilled with current values.
  - Saving updates Company row; non-trivial changes (legal name, tax ID) trigger an admin notification but don't re-block verification.
  - Logo replacement deletes the old file.
- **Effort:** M
- **Depends on:** S-03.1
- **Phase:** 2

---

## E-04 — Publisher Listings

**Goal:** Publishers create, edit, manage listings with channel type, dates, audience demographics, no public price. Status state machine. Per-listing analytics.

**Linked Journey:** 2.
**Linked FRs:** 021–025, 079, 080.

### S-04.1 — Listing create form

- **As** a verified publisher, **I want** to create a listing with title, channel type, source channel, dates, audience, description, and attachments, **so that** advertisers can find it.
- **Acceptance criteria:** [FR-021, 079, 080]
  - `/listings/new` form: title (required), channel type (enum select), source channel (autocomplete from `SourceChannel` table, scoped to publisher's company), availability date range, audience demographics (key-value JSON editor — age range, daily reach, region), description (rich text, no images), optional attachments (≤10 MB each, PDF/JPG/PNG/WEBP, ≤5 files).
  - Saving creates Listing row with status `DRAFT`.
  - Attachments stored at `storage/uploads/listings/<listingId>/<random>.<ext>`.
- **Effort:** L
- **Depends on:** S-03.5 (publisher verified), S-storage helpers
- **Phase:** 2

### S-04.2 — Edit listing

- **As** a publisher, **I want** to edit any of my listings, **so that** I can keep info current.
- **Acceptance criteria:** [FR-022]
  - Same form as create, prefilled.
  - Edits to active listings appear immediately in catalog.
- **Effort:** M
- **Depends on:** S-04.1
- **Phase:** 2

### S-04.3 — Listing status transitions (Draft → Active → Paused → Closed)

- **As** a publisher, **I want** to control my listing's status, **so that** I can pause inactive ones and close expired ones.
- **Acceptance criteria:** [FR-023]
  - Status dropdown on listing detail (publisher view): allowed transitions per state machine.
  - Closed listings remain visible to publisher (for analytics) but not in public catalog.
- **Effort:** S
- **Depends on:** S-04.1
- **Phase:** 2

### S-04.4 — Per-listing analytics (views, inquiry counts)

- **As** a publisher, **I want** to see view count and inquiry count per listing, **so that** I know which inventory is in demand.
- **Acceptance criteria:** [FR-024]
  - View count increments on catalog detail page render (cached per session to avoid double-counting).
  - Inquiry count increments when an Inquiry is created against this listing.
  - Publisher dashboard My Listings table shows these counts per row.
- **Effort:** S
- **Depends on:** S-04.1
- **Phase:** 2

### S-04.5 — Public listing detail page

- **As** any visitor, **I want** to see a listing detail page with publisher info, dates, channel, audience, description, **so that** I can decide whether to inquire.
- **Acceptance criteria:** [FR-020]
  - `/catalog/listings/:id` renders listing card matching ux-design §5.1.
  - No price shown anywhere.
  - "Request Information" CTA — for logged-out: prompts login; for unverified: tooltip per S-03.3; for verified advertisers: opens `/inquiries/new?listingId=:id`.
- **Effort:** M
- **Depends on:** S-04.1, S-01.5
- **Phase:** 2

### S-04.6 — Admin override on listings

- **As** an admin, **I want** to edit, unpublish, or flag any listing for review, **so that** I can curate platform content.
- **Acceptance criteria:** [FR-025]
  - `/admin/listings` lists all listings (any status) with filters.
  - Admin can edit any field; flag with reason; unpublish (sets to `PAUSED` with admin note).
  - Actions logged in audit log.
- **Effort:** M
- **Depends on:** S-04.1, S-08.1
- **Phase:** 2

---

## E-05 — Advertiser Inquiries & Wishlist

**Goal:** Verified advertisers submit inquiries on listings, manage them via "My Inquiries" dashboard, save listings to wishlist, submit quick-inquiry from wishlist. Inquiry status lifecycle is enforced.

**Linked Journey:** 1, 3.
**Linked FRs:** 026–030, 039, 040.

### S-05.1 — Submit inquiry on a listing

- **As** a verified advertiser, **I want** to submit an inquiry on a specific listing, **so that** the platform team starts negotiating for me.
- **Acceptance criteria:** [FR-026]
  - `/inquiries/new?listingId=:id` form: campaign goal (textarea, required), desired dates (date range), optional private budget range (min/max), notes (textarea).
  - Server Action creates Inquiry with `status: NEW`, `advertiserUserId` and `advertiserCompanyId` from session, `publisherCompanyId` and `listingId` from form context.
  - Rate limit: 20 inquiries per advertiser per hour (NFR-015).
  - On success, redirect to `/inquiries/:id` with success toast "Inquiry submitted. We'll be in touch within 4 hours."
  - SLA deadline `createdAt + 4 business hours` set on Inquiry.
- **Effort:** M
- **Depends on:** S-03.5 (advertiser verified), S-04.1
- **Phase:** 3

### S-05.2 — Submit general inquiry (no specific listing)

- **As** a verified advertiser, **I want** to submit a general inquiry to a publisher not tied to a specific listing, **so that** I can ask about inventory the publisher hasn't yet listed.
- **Acceptance criteria:** [FR-027]
  - From publisher detail page, button "Send a general inquiry" → form similar to S-05.1 but `listingId = NULL`.
  - Server allows null `listingId`.
- **Effort:** S
- **Depends on:** S-05.1
- **Phase:** 3

### S-05.3 — Advertiser My Inquiries dashboard

- **As** an advertiser, **I want** to see all my inquiries in a list with status, last activity, assigned admin, **so that** I can track ongoing conversations.
- **Acceptance criteria:** [FR-028]
  - `/inquiries` renders a table per ux-design §5.3.
  - Columns: ID, Publisher, Listing (or "General"), Status, Last Activity, Age.
  - Status filter chips: All / Open / Awaiting You / Confirmed / Closed.
  - Row click opens `/inquiries/:id`.
  - Empty state: "No inquiries yet. Browse opportunities." [Browse → ]
- **Effort:** M
- **Depends on:** S-05.1
- **Phase:** 3

### S-05.4 — Advertiser Inquiry Detail (without chat yet)

- **As** an advertiser, **I want** to open an inquiry and see its status, the listing, the publisher, and a timeline of activity, **so that** I have context.
- **Acceptance criteria:** [FR-028, 030]
  - `/inquiries/:id` renders the layout from ux-design §6.2 — context panel left, embedded chat placeholder right (chat itself comes in E-07).
  - Status timeline shows all transitions with timestamps and actors.
  - Quick links: View listing, View publisher, Cancel inquiry (only if status is NEW or ASSIGNED).
- **Effort:** M
- **Depends on:** S-05.1, S-05.3
- **Phase:** 3

### S-05.5 — Inquiry status state machine enforcement

- **As** the platform, **I want** to enforce that inquiry status only transitions through valid states, **so that** workflow stays consistent.
- **Acceptance criteria:** [FR-029, 030]
  - Server-side helper `transitionInquiryStatus(inquiry, newStatus, actor, reason?)` validates transition is in allowed set per state machine.
  - Allowed transitions documented in `src/lib/inquiry-fsm.ts`.
  - Every transition writes an entry to `AuditEntry`.
  - Direct database manipulation is disallowed in app code (lint rule + code review).
- **Effort:** M
- **Depends on:** S-05.1
- **Phase:** 3

### S-05.6 — Add and remove from wishlist

- **As** a verified advertiser, **I want** to save listings or publishers to my wishlist with a single click, **so that** I can come back later.
- **Acceptance criteria:** [FR-039]
  - Save button (star icon, ghost) on listing card and publisher detail page.
  - Wishlist page `/wishlist` shows two tabs: Saved listings / Saved publishers. Grid view.
  - Click on saved item navigates to detail page.
  - Remove button on hover.
- **Effort:** M
- **Depends on:** S-04.5
- **Phase:** 2

### S-05.7 — Quick-inquiry from wishlist

- **As** an advertiser viewing my wishlist, **I want** to submit an inquiry on a saved listing with one click, **so that** I save time.
- **Acceptance criteria:** [FR-040]
  - "Inquire" button on each wishlist listing row → `/inquiries/new?listingId=:id` with form prefilled where possible.
  - For saved publishers: "General inquiry" button → `/inquiries/new?publisherCompanyId=:id`.
- **Effort:** S
- **Depends on:** S-05.6, S-05.1
- **Phase:** 3

---

## E-06 — Notifications

**Goal:** In-app notifications drawer + Resend email digests for critical and daily events. Admin gets in-app pings for new inquiries, signups, verifications, assignments, SLA breaches.

**Linked Journey:** 1, 3, 4.
**Linked FRs:** 041–044.

### S-06.1 — Email infrastructure (Resend wrapper + templates)

- **As** Amelia, **I want** a single `sendEmail()` helper that wraps Resend SDK, logs failures to Sentry, and persists `Notification` rows regardless, **so that** in-app notification always fires even if email fails.
- **Acceptance criteria:**
  - `src/lib/email.ts` exports `sendEmail({ to, template, data })`.
  - Templates in `emails/` as React Email components: VerifyEmail, ResetPasswordEmail, VerificationApprovedEmail, VerificationRejectedEmail, InquiryStatusEmail, NewMessageEmail, DailyDigestEmail.
  - Failures captured in Sentry with `tryEmailSend()` wrapper; in-app Notification row written first.
- **Effort:** M
- **Depends on:** S-01.1
- **Phase:** 1

### S-06.2 — In-app notification drawer (user-side)

- **As** any logged-in user, **I want** to see my unread and recent notifications via a bell icon, **so that** I don't miss platform updates.
- **Acceptance criteria:** [FR-041, 044]
  - Bell icon in top nav shows unread count badge (refreshed on page load — no real-time push, per ADR-006).
  - Click opens a Sheet (right-side drawer) with list of notifications, newest first.
  - Each notification: type icon, title, body, link, timestamp.
  - Click marks individual notification as read; "Mark all read" link at top.
- **Effort:** M
- **Depends on:** S-02.3
- **Phase:** 3

### S-06.3 — Trigger notifications for user events

- **As** the platform, **I want** to fire notifications when users have inquiries / verifications / listings / messages updated, **so that** they stay informed.
- **Acceptance criteria:** [FR-041, 042]
  - On verification result: in-app `VERIFICATION_RESULT` + email (instant).
  - On inquiry status change: in-app `INQUIRY_STATUS` + email (instant).
  - On listing decision (approval/rejection by admin): in-app `LISTING_DECISION` + email (instant).
  - On new message received from platform team (via chat webhook, see S-07.4): in-app `INQUIRY_MESSAGE` + email (instant if first response after >24h gap, otherwise daily digest).
  - Daily digest cron: 09:00 local time, summarizes unread events from last 24h.
- **Effort:** L
- **Depends on:** S-06.1, S-06.2, S-03.5, S-05.5
- **Phase:** 3

### S-06.4 — Admin notifications

- **As** an admin, **I want** in-app notifications for new inquiries, new signups, new verification requests, assignments to me, and SLA breaches, **so that** I notice work needing attention.
- **Acceptance criteria:** [FR-043]
  - On Inquiry creation: notification to all Owner+Manager admins (`ADMIN_ASSIGN` if assigned to specific admin).
  - On User signup: notification to all Owner+Manager admins.
  - On VerificationRequest creation: notification to all Owner+Manager admins.
  - On Inquiry SLA breach (cron checks `slaDeadline < now()` every 15 minutes): notification to assigned admin (or all Owner+Manager if unassigned).
- **Effort:** M
- **Depends on:** S-06.1, S-06.2
- **Phase:** 3

---

## E-07 — Third-Party Chat Integration

**Goal:** Two isolated chat threads per Inquiry via third-party provider (TBD). Provider's React widget embedded on inquiry detail pages. Webhook receives new-message events. Platform stores only thread IDs.

**Linked Journey:** 1, 2, 4.
**Linked FRs:** 031–036.

### S-07.1 — Chat provider selection + integration kickoff

- **As** Hayk, **I want** to select a chat provider with a free tier covering ~130 MAU and embeddable React widget, **so that** the rest of the chat work can proceed.
- **Acceptance criteria:**
  - Evaluation of candidates documented in `_bmad-output/planning-artifacts/chat-provider-selection.md`: Stream Chat, Sendbird, Talk.js, CometChat (others as found).
  - Decision recorded as ADR-010 in `architecture.md` appendix.
  - Provider SDK installed; sandbox keys in `.env.example`.
- **Effort:** M
- **Depends on:** —
- **Phase:** 3 (week 8 latest)
- **Notes:** This is a non-coding story but blocks all chat work.

### S-07.2 — Initialize chat threads on Inquiry creation

- **As** the platform, **I want** to create two private threads with the chat provider when an Inquiry is created, **so that** both sides have isolated channels.
- **Acceptance criteria:** [FR-031]
  - On Inquiry create, server calls provider API to create:
    - Thread A (advertiser ↔ admin): members = `advertiserUser.id` + assigned admin (or "platform-team" group if not yet assigned).
    - Thread B (admin ↔ publisher): members = publisher company's primary user + same admin.
  - Thread IDs saved on Inquiry as `advertiserChatThreadId` and `publisherChatThreadId`.
  - On failure to create threads, Inquiry create still succeeds, error logged in Sentry, admin alerted.
- **Effort:** M
- **Depends on:** S-07.1, S-05.1
- **Phase:** 3

### S-07.3 — Embed chat widget on advertiser & publisher inquiry detail pages

- **As** an advertiser/publisher, **I want** to see and use the embedded chat widget on the inquiry detail page, **so that** I can communicate with the platform team.
- **Acceptance criteria:** [FR-032, 033, 034]
  - Advertiser inquiry detail (`/inquiries/:id`): widget initialized with `advertiserChatThreadId`. Publisher-side thread NOT visible.
  - Publisher inquiry detail (`/inquiries/:id` in publisher cabinet): widget initialized with `publisherChatThreadId`. Advertiser-side thread NOT visible.
  - Widget styling overridden to match Modern Dark tokens.
- **Effort:** L
- **Depends on:** S-07.2, S-05.4
- **Phase:** 3

### S-07.4 — Chat provider webhook for new-message events

- **As** the platform, **I want** to receive a webhook when a new message is sent in any thread, **so that** I can trigger notifications and SLA tracking.
- **Acceptance criteria:** [FR-031, 035, 036]
  - `/api/webhooks/chat` POST endpoint validates HMAC signature against `CHAT_PROVIDER_WEBHOOK_SECRET`.
  - On message event: fires Notification to the recipient via S-06.x; updates Inquiry `updatedAt`; if first admin reply, marks SLA met.
  - Audit-logged.
- **Effort:** M
- **Depends on:** S-07.2, S-06.3
- **Phase:** 3

### S-07.5 — Admin embedded chat on inquiry detail (both threads)

- **As** an admin, **I want** to see both chat threads side-by-side in the inquiry detail split-pane, **so that** I can mediate efficiently.
- **Acceptance criteria:** [FR-035]
  - In `/admin/inquiries/:id` (E-09 wireframe ux §6.4), middle column initialises widget with `advertiserChatThreadId`; right column with `publisherChatThreadId`.
  - Admin user can send messages to both.
- **Effort:** M
- **Depends on:** S-07.3, S-09.x (admin inquiry detail)
- **Phase:** 3

---

## E-08 — Admin Auth & Dashboard

**Goal:** Admin separate URL with TOTP 2FA. Dashboard with KPIs, My Queue, Team Queue, activity feed, announcements.

**Linked Journey:** 4.
**Linked FRs:** 045, 046, 047.

### S-08.1 — Admin login + TOTP 2FA enforcement

- **As** an admin, **I want** to log in at admin.advertising-platform.am with email+password followed by a TOTP code, **so that** admin access is two-factor protected.
- **Acceptance criteria:** [FR-045, NFR-013]
  - Subdomain routing: `admin.*` only resolves admin UI; main domain redirects `/admin/*` to admin subdomain.
  - Login flow: email+password → 2FA setup if `twoFactorEnabled=false` → TOTP prompt if enabled.
  - First-time admin: forced 2FA enrollment screen with QR code (otplib) and verification code entry. Sets `twoFactorEnabled=true` and encrypted `twoFactorSecret`.
  - Subsequent logins: TOTP prompt; verified state stored in session (until session expires).
- **Effort:** L
- **Depends on:** S-02.3
- **Phase:** 3
- **Notes:** TOTP secret encrypted with `TWOFACTOR_ENCRYPTION_KEY` env var.

### S-08.2 — Admin session timeout (1 hour)

- **As** the platform, **I want** admin sessions to expire after 1 hour of inactivity, **so that** abandoned admin sessions don't pose a security risk.
- **Acceptance criteria:** [FR-046, NFR-019]
  - JWT session for admin has 1-hour sliding window.
  - Expired session redirects to `/admin/login`.
- **Effort:** S
- **Depends on:** S-08.1
- **Phase:** 3

### S-08.3 — Admin dashboard layout

- **As** an admin, **I want** a dashboard showing today's KPIs, my queue, team queue, recent activity, and announcements, **so that** I have situational awareness on every login.
- **Acceptance criteria:** [FR-047]
  - `/admin` renders per ux-design §6.3.
  - 5 KPI cards: New inquiries today, Active inquiries, Pending verifications, New signups today, Median response time (last 7d).
  - My Queue widget: lists inquiries `WHERE assignedAdminId = me AND status NOT IN (CONFIRMED, LOST, CANCELLED)`, sorted by SLA urgency.
  - Team Queue widget: `WHERE assignedAdminId IS NULL AND status = NEW`.
  - Activity feed: last 20 platform events from AuditEntry (all admins).
  - Announcements: pinned ones from Owner.
- **Effort:** L
- **Depends on:** S-08.1, S-05.5 (status state machine)
- **Phase:** 3

### S-08.4 — Claim unassigned inquiry from dashboard

- **As** an admin, **I want** to claim an unassigned inquiry with one click from my dashboard, **so that** I can start handling it without navigating.
- **Acceptance criteria:** [FR-051]
  - "Claim" button on each Team Queue row.
  - Sets `assignedAdminId = me`, transitions status `NEW → ASSIGNED`, fires audit entry, removes from Team Queue, adds to My Queue.
- **Effort:** S
- **Depends on:** S-08.3
- **Phase:** 3

---

## E-09 — Admin Inquiry Queue & Mediation

**Goal:** Full admin inquiry queue with filters / saved views / bulk actions. Inquiry detail 3-column split-pane with chat, status transitions, internal notes, mentions, call logging.

**Linked Journey:** 4.
**Linked FRs:** 037, 038, 048, 049, 050, 052, 053, 054, 055, 056, 057, 058, 059, 060, 061.

### S-09.1 — Admin inquiry queue with filters

- **As** an admin, **I want** a paginated queue of all inquiries with rich filters, **so that** I can find specific ones quickly.
- **Acceptance criteria:** [FR-048, 049]
  - `/admin/inquiries` table per ux §6.3 KPI dashboard pattern.
  - Filters: status (multi-select), assigned admin (incl. "unassigned"), channel type, industry, date range, SLA-breached only.
  - Search across advertiser name, publisher name, listing title, inquiry ID.
  - 50 inquiries / page.
- **Effort:** L
- **Depends on:** S-08.3
- **Phase:** 3
- **Decisions:**
  - Filters drive off `searchParams` so the URL is the source of truth; the form is `method="get"` (no client JS for the filter wiring).
  - Industry filter applies to `advertiserCompany.industries` (the side that's choosing where to spend). Publisher-industry filtering can join later if a real use case emerges.
  - SLA-breached toggle also constrains to open statuses (closed inquiries can't breach prospectively).
  - Inquiry-ID search uses `endsWith` so the tail-8 we surface as `INQ-XXXXXXXX` resolves; full cuid prefixes also match.

### S-09.2 — Saved views

- **As** an admin, **I want** to save my filter combinations as named views, **so that** I can return to them quickly.
- **Acceptance criteria:** [FR-050]
  - "Save current view" creates a `SavedView` row scoped to the admin user.
  - Saved views appear as quick filter chips at the top of the queue.
- **Effort:** M
- **Depends on:** S-09.1
- **Phase:** 4

### S-09.3 — Reassign / change status from queue

- **As** an admin, **I want** to reassign an inquiry to a teammate and change its status without opening detail, **so that** I can triage at scale.
- **Acceptance criteria:** [FR-052, 053]
  - Per-row actions: Reassign (dropdown of admins), Change status (dropdown of valid transitions).
  - All actions audit-logged.
- **Effort:** M
- **Depends on:** S-09.1, S-05.5
- **Phase:** 3
- **Decisions:**
  - Controls are native `<form action={serverAction}>` with auto-submit on `onChange` — no client-side transition tracking, no pending-state UI; revalidatePath rerenders the row. Simpler than wrapping every change in useTransition, which in React 18 doesn't await the async server action anyway.
  - Status `<select>` only lists valid transitions per `allowedInquiryTransitions`; a terminal state (CONFIRMED/LOST/CANCELLED) renders "Terminal" instead of a dropdown.
  - Audit-log action labels match those already emitted by the `db:inquiry` dev script (`ADMIN_ASSIGN`, `ADMIN_PROGRESS`, etc.) plus new `ADMIN_REASSIGN` / `ADMIN_UNASSIGN`.

### S-09.4 — Bulk actions

- **As** an admin, **I want** to select multiple inquiries and perform bulk assign / bulk close, **so that** I can clean up old inquiries efficiently.
- **Acceptance criteria:** [FR-054]
  - Checkbox column. Header checkbox for select-all.
  - Bulk action bar appears when ≥1 selected: [Assign to →] [Close as Won/Lost/Cancelled →].
- **Effort:** M
- **Depends on:** S-09.1
- **Phase:** 4
- **Decisions:**
  - Selection state lives in the DOM (checkboxes inside a `<form>`), not in React state. `BulkForm` client wrapper just `querySelectorAll(':checked')`-counts on each `change` event. The server-rendered table can repaint freely without React resync — and the form's native submit ships the IDs as `formData.getAll('inquiryIds')` with zero glue.
  - Bulk assign is a single Server Action call. Bulk close routes to a dedicated `/admin/inquiries/bulk-close?as=…&ids=…` page (reuses the S-09.7 design — reason capture for Lost/Cancelled, optional for Confirmed). One shared reason is written to every selected inquiry; FSM-invalid ones are silently skipped and counted in the success flash on the queue.
  - Flash message arrives via `?bulkClosed=N&bulkSkipped=M` redirected from the action.

### S-09.5 — Admin inquiry detail split-pane (3 columns)

- **As** an admin, **I want** to open an inquiry in a 3-column split-pane with context, advertiser chat, publisher chat, **so that** I can mediate without context-switching.
- **Acceptance criteria:** [FR-055, 056]
  - `/admin/inquiries/:id` matches ux §6.4 wireframe.
  - Columns resizable via drag handles; defaults 25% / 37.5% / 37.5%.
  - Context panel: status (dropdown of valid transitions), advertiser/publisher/listing cards, SLA timer (live), close-as-* buttons.
  - Middle: advertiser chat widget (S-07.5).
  - Right: publisher chat widget (S-07.5).
- **Effort:** XL
- **Depends on:** S-07.5, S-09.3
- **Phase:** 3
- **Notes:** Likely the single biggest dev story. Split if needed: layout + context (S-09.5a) and chat embed wiring (S-09.5b).
- **Status:** **S-09.5a shipped** as a single-column detail page (the 3-col split + chat columns wait on E-07). `/admin/inquiries/[id]` now renders context cards (advertiser + publisher + listing), the full brief, inline reassign + status controls (reusing the queue's row components), close-as-* CTAs, and the activity timeline (S-09.10). Chat-pane wiring is **S-09.5b** — blocked until a chat provider is picked.

### S-09.6 — Quick-response templates

- **As** an admin, **I want** to use predefined message templates when composing, **so that** I save time on common replies.
- **Acceptance criteria:** [FR-057]
  - Templates table (CRUD in Admin Settings — see S-10.7).
  - Templates dropdown above the chat composer with categorized list.
  - Selecting a template inserts text into the composer; admin can edit before sending.
- **Effort:** M
- **Depends on:** S-09.5, S-10.7
- **Phase:** 4

### S-09.7 — Confirm / Lost / Cancel with reason

- **As** an admin, **I want** to mark an inquiry as Confirmed, Lost, or Cancelled with a captured reason, **so that** we have lifecycle data.
- **Acceptance criteria:** [FR-058]
  - Buttons in context panel open a modal: reason textarea required for Lost/Cancelled, optional for Confirmed.
  - Transitions enforced by state machine (S-05.5).
  - Sets `closedAt`, `closeReason`. Audit-logged.
- **Effort:** M
- **Depends on:** S-09.5, S-05.5
- **Phase:** 3
- **Decisions:**
  - Implemented as a dedicated `/admin/inquiries/[id]/close?as=lost|cancelled|confirmed` subroute rather than an in-page modal — no client modal library, deep-linkable, plays nicely with the existing useFormState pattern.
  - Queue's StatusControl intercepts terminal options and `router.push`-es to the close route instead of submitting; the inline `changeInquiryStatus` action also refuses terminal transitions outright (defense in depth — a forged request can't skip reason capture).
  - Reason written to both `Inquiry.closeReason` and `InquiryAuditEntry.note` so the future timeline (S-09.10) can quote it verbatim. Lost / Cancelled require ≥5 chars; Confirmed is optional per AC.

### S-09.8 — Internal notes with @-mentions

- **As** an admin, **I want** to add internal notes (admin-only visibility) on an inquiry and @-mention teammates, **so that** I can collaborate asynchronously.
- **Acceptance criteria:** [FR-059, 060]
  - Activity timeline at the bottom of inquiry detail has "Add internal note" composer.
  - @ trigger shows autocomplete of admins.
  - On save: writes `InternalNote` row; mentioned admins receive in-app `ADMIN_MENTION` notification.
  - Notes only visible to users with `role = ADMIN`.
- **Effort:** M
- **Depends on:** S-09.5, S-06.4
- **Phase:** 3
- **Status:** Notes shipped — schema (`InternalNote`), addInternalNote server action, NoteComposer on the detail page, interleaved into the activity timeline (lime-tinted card to differentiate from audit events). **@-mention autocomplete + ADMIN_MENTION notifications are deferred** — they ride S-06.4 (admin in-app notifications), which isn't built yet. Until then, raw `@name` text in a note is just text.

### S-09.9 — Log a voice call

- **As** an admin, **I want** to log voice calls (date, duration, party, notes) against an inquiry, **so that** off-platform conversations are captured.
- **Acceptance criteria:** [FR-037, 038]
  - "📞 Log a call" button on each chat column.
  - Modal: date (default now), duration in minutes, side (Advertiser/Publisher, prefilled by column), notes textarea.
  - Saves `Call` row. Appears in inquiry activity timeline.
- **Effort:** S
- **Depends on:** S-09.5
- **Phase:** 3

### S-09.10 — Activity timeline & inquiry history

- **As** an admin, **I want** to see the full timeline of events on an inquiry (messages, status changes, calls, internal notes), **so that** I have context when picking up an inquiry mid-flight.
- **Acceptance criteria:** [FR-061]
  - Timeline merges: chat-provider webhook events, AuditEntry rows for this inquiry, Call rows, InternalNote rows.
  - Sorted chronologically (newest first or oldest first toggle).
  - Filterable by event type.
- **Effort:** M
- **Depends on:** S-09.5, S-09.8, S-09.9
- **Phase:** 4
- **Status:** Initial cut shipped on the detail page (S-09.5a). Reads `InquiryAuditEntry` only — `InternalNote`, `Call`, and chat-webhook events fold in as those stories land. Order toggle works via `?order=asc|desc`. Event-type filter intentionally deferred until there are >1 source feeding the timeline.
- **Decisions:**
  - Actor names resolved via a separate `user.findMany({ where: { id: { in: actorIds } } })` rather than a schema relation — keeps the audit table append-only without forcing a relation rewrite when we ship S-12.x generic audit.
  - Unknown action codes fall back to the raw string so a new code never disappears silently from the timeline; we just see the literal action label until the verb map is updated.

---

## E-10 — Platform Administration & Analytics

**Goal:** Taxonomy editing, user/company/listing management, impersonation, featured-publishers curation, announcements, analytics dashboard, audit log, admin team management.

**Linked Journey:** 4.
**Linked FRs:** 062–076.

### S-10.1 — Taxonomy editor (industries, channel types, source channels, regions)

- **As** an Owner/Manager admin, **I want** CRUD on industries, channel types, source channels, regions, **so that** I can keep the taxonomy current.
- **Acceptance criteria:** [FR-062, 063, 064, 065]
  - `/admin/taxonomy` with 4 tabs.
  - Each tab: list of entries with rename / archive / add new.
  - Hierarchy support for industries (parent-child) and regions (country/marz/city).
  - Source channels link to a Company (owner).
- **Effort:** L
- **Depends on:** S-08.1
- **Phase:** 2 (blocks S-03.1 ideally — bootstrapping data)

### S-10.2 — User management

- **As** an admin, **I want** to view, edit, suspend, delete, reset password, impersonate any user, **so that** I can support customers.
- **Acceptance criteria:** [FR-066, 067, 068]
  - `/admin/users` table with filters (role, status, verification, signup date, last active).
  - User detail page: profile, company, inquiry history, audit history.
  - Actions: Edit, Suspend (with reason — sets `suspended=true`, blocks login), Delete (soft-delete), Reset Password (sends email link via Resend), Impersonate (opens new tab in read-only mode with banner "Impersonating <user>. Read-only.").
- **Effort:** L
- **Depends on:** S-08.1
- **Phase:** 4

### S-10.3 — Company management

- **As** an admin, **I want** to view, edit, or unpublish any company, **so that** I can curate platform participants.
- **Acceptance criteria:** [FR-069]
  - `/admin/companies` table with filters.
  - Company detail: employees, listings, inquiries, verification history.
  - Actions: Edit, Unpublish (sets all listings to PAUSED, blocks new inquiries from advertisers).
- **Effort:** M
- **Depends on:** S-10.2
- **Phase:** 4

### S-10.4 — Admin team management (admin users + sub-roles)

- **As** an Owner admin, **I want** to create, edit, disable admin user accounts and assign sub-roles, **so that** I can manage the platform team.
- **Acceptance criteria:** [FR-070, 071]
  - `/admin/team` lists admin users with sub-role chips.
  - Create new admin: email + name + sub-role (Owner / Manager / Broker / Support). Sends invite email with one-time setup link.
  - Edit admin sub-role.
  - Disable admin (revokes access immediately; keeps audit trail).
- **Effort:** L
- **Depends on:** S-08.1, S-02.5 (password reset)
- **Phase:** 3

### S-10.5 — Featured publishers curator

- **As** an Owner/Manager admin, **I want** to drag-and-drop featured listings into a homepage spotlight with date windows, **so that** I can promote inventory.
- **Acceptance criteria:** [FR-072]
  - `/admin/featured` shows ordered list of `FeaturedListing` rows. Drag-and-drop to reorder.
  - Add new: select listing, set `startsAt` and `endsAt`.
  - Homepage queries featured listings where `startsAt <= now() <= endsAt`, ordered by `position`.
- **Effort:** M
- **Depends on:** S-01.3 (homepage featured strip)
- **Phase:** 4

### S-10.6 — Broadcast announcements

- **As** an Owner/Manager admin, **I want** to publish announcements with audience selector and schedule windows, **so that** I can communicate platform-wide.
- **Acceptance criteria:** [FR-073]
  - `/admin/announcements` lists past and scheduled announcements.
  - New: title, body (rich text), audience (All / Advertisers / Publishers / custom user list), starts/ends datetime.
  - Active announcements render as top-of-page banner in target audience cabinets.
- **Effort:** L
- **Depends on:** S-08.1
- **Phase:** 4

### S-10.7 — Admin settings: email templates, SLA rules, brand assets, legal pages

- **As** an Owner admin, **I want** to edit email templates, SLA configuration, brand assets, legal pages, **so that** I can change platform-wide settings without redeployment.
- **Acceptance criteria:**
  - `/admin/settings` with tabs: Email Templates / SLA Rules / Brand / Legal.
  - Email templates: list of templates with body editor (React Email components — initially read-only display of source until template editor is built).
  - SLA rules: configurable "flag inquiry if no admin reply in X business hours" (default 4).
  - Brand: logo upload, accent color tweak (not exposed in MVP — placeholder).
  - Legal pages: editable ToS, Privacy, License content (markdown).
- **Effort:** L
- **Depends on:** S-08.1
- **Phase:** 4

### S-10.8 — Platform analytics dashboard

- **As** an admin, **I want** to view platform-wide analytics with date-range picker and CSV export, **so that** I can report on platform health.
- **Acceptance criteria:** [FR-075, 076]
  - `/admin/analytics` with date-range picker (default last 30 days).
  - Widgets:
    - Growth: daily/weekly/monthly active users (line chart).
    - Signups: total + breakdown by role + funnel from signup→verified.
    - Inquiries: submitted, in-progress, confirmed, lost — by week, by channel type, by industry.
    - Funnel: Catalog view → Listing detail → Inquiry submitted → Confirmed (Sankey or step chart).
    - Admin performance: response time per admin, inquiries handled per admin, conversion rate.
    - Top performers: top 10 publishers by inquiries received, top 10 advertisers by inquiries submitted.
    - Verification metrics: time-to-verify, approval rate.
    - Search insights: top search terms, zero-result searches.
  - Each widget exportable to CSV.
- **Effort:** XL
- **Depends on:** S-09.x (full inquiry data), S-08.3
- **Phase:** 4
- **Notes:** Consider splitting into 2 stories — basic widgets (S-10.8a) and search insights / admin perf (S-10.8b).

### S-10.9 — Audit log viewer

- **As** an admin, **I want** to view the immutable audit log filterable by admin, action, entity, date, **so that** I can investigate issues.
- **Acceptance criteria:** [FR-074]
  - `/admin/audit` table of all `AuditEntry` rows.
  - Filters: actor admin, action type, entity type, date range.
  - Click a row to see before/after JSON diff.
  - No delete or edit affordances — read-only.
- **Effort:** M
- **Depends on:** S-08.1
- **Phase:** 4

---

## Cross-cutting concerns

Not stories — operational requirements that apply across epics.

### Testing

- Playwright E2E for the three critical paths is acceptance for MVP launch (NFR-040):
  1. Registration → email verification → company profile → wait for admin approval.
  2. Browse catalog → open listing → submit inquiry → see status in My Inquiries.
  3. Admin login + 2FA → claim inquiry → reply (chat widget mocked) → change status → log call → confirm.
- Critical-path tests gate every release (CI green required).

### Observability

- Sentry wired by S-01.1.
- PostHog wired by S-01.1.
- Critical product events emitted: `inquiry_submitted`, `inquiry_status_change`, `listing_created`, `admin_claim`, `deal_confirmed`, `verification_decision`. Each call captures `userId`, `companyId`, `inquiryId` (where applicable).

### Performance

- All catalog/queue endpoints paginated.
- All hot-query columns indexed (NFR-023) per architecture §4.1.
- Slow-query log monitored manually post-launch.

### Security

- Every Server Action starts with `requireSession` / `requireRole` / `require2FA` per architecture ADR-007.
- Rate limits per NFR-014, NFR-015 implemented as in-memory token bucket (no Redis on Hostinger).
- All admin writes write to `AuditEntry` (NFR-017).

---

## Story counts by phase

| Phase | Window | Stories | Effort estimate |
|---|---|---|---|
| 1 | Weeks 1–4 (Foundations) | S-01.1 to S-01.4, S-02.1 to S-02.5, S-06.1 | ~10 stories, M+L mix |
| 2 | Weeks 5–8 (Marketplace Core) | S-01.5, S-02.6, S-03.x (7), S-04.x (6), S-05.6, S-10.1 | ~16 stories, mostly L+M |
| 3 | Weeks 9–12 (Inquiry Workflow) | S-05.1–5, S-05.7, S-06.2–4, S-07.x (5), S-08.x (4), S-09.1, S-09.3, S-09.5, S-09.7–9, S-10.4 | ~22 stories, mix incl. XL S-09.5 |
| 4 | Weeks 13–16 (Polish & Beta) | S-09.2, S-09.4, S-09.6, S-09.10, S-10.2, S-10.3, S-10.5, S-10.6, S-10.7, S-10.8, S-10.9 | ~11 stories incl. XL S-10.8 |

**Total: 59 dev stories** + 3 non-coding (chat provider eval, ADRs). Approximate.

## Definition of Done

A story is done when:

- All acceptance criteria pass manual QA.
- Critical-path Playwright tests still green (if relevant).
- TypeScript strict mode passes (no `any`).
- ESLint passes.
- Code reviewed (self-review for solo dev with PR description + screenshots / Loom video).
- Server-side authorization check is present and reviewed.
- Audit entry written on admin writes.
- Sentry + PostHog events fire correctly (where applicable).
- Empty / loading / error states implemented per ux-design §7.

---

**End of epics-and-stories document.**

**Next action:** Amelia (BMAD developer) picks up story by story, starting with **S-01.1 — Project scaffold**. Recommended cadence: one story / 0.5–2 days, with a working deployable at the end of each story.
