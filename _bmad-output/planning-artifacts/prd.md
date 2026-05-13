---
stepsCompleted:
  - 'step-01-init'
  - 'step-02-discovery'
  - 'step-02b-vision'
  - 'step-02c-executive-summary'
  - 'step-03-success'
  - 'step-04-journeys'
  - 'step-05-domain'
  - 'step-06-innovation'
  - 'step-07-project-type'
  - 'step-08-scoping'
  - 'step-09-functional'
  - 'step-10-nonfunctional'
  - 'step-11-polish'
  - 'step-12-complete'
status: 'COMPLETE'
completedAt: '2026-05-13'
inputDocuments:
  - 'Advertising_Platform_TZ_v3.1.md'
  - 'Advertising_Platform_TZ_v3.docx'
  - 'Claude_Code_Kickoff.md'
workflowType: 'prd'
project_name: 'Advertising Platform'
user_name: 'Hayk'
date: '2026-05-13'
brownfield: true
classification:
  projectType: 'saas_b2b'
  domain: 'general'
  complexity: 'medium'
  projectContext: 'brownfield'
  notes: 'Multi-sided B2B brokered marketplace. AdTech vertical, no regulatory compliance requirements (not fintech/healthcare/govtech). Multi-tenant + RBAC + workflow state machine (Inquiry lifecycle). Web-only, desktop-first.'
---

# Product Requirements Document — Advertising Platform

**Author:** Hayk
**Date:** 2026-05-13
**Status:** IN_PROGRESS — being built via BMAD CP workflow
**Source:** Restructured from `Advertising_Platform_TZ_v3.1.md` (working title: "Advertising Platform", final brand TBD)

## Executive Summary

Advertising Platform is a brokered B2B marketplace that aggregates Armenia's advertising inventory — TV, radio, outdoor, web, video, product placement in film — into a single catalog. Advertisers (brands, film studios, agencies) browse listings without cold-outreaching publishers individually. The platform's internal team mediates every inquiry, handling negotiation with publishers on the advertiser's behalf.

**Target users:**

- **Advertisers** — brands, agencies, film distributors looking for ad inventory across channels.
- **Publishers** — TV channels, radio stations, billboard operators, video platforms, film/series producers offering product placement.
- **Platform team (Super Admin)** — internal staff who broker every deal end-to-end.

**Problem solved:** Armenia's advertising inventory is fragmented across dozens of operators with no central catalog. Advertisers cold-outreach each publisher individually. Publishers receive low-quality inbound. Fragmentation suppresses transaction volume on both sides.

### What Makes This Special

The defining bet is **aggregation as the value, brokerage as the mechanic**. Alternative approaches — peer-to-peer marketplace, unmoderated listing directory, programmatic ad exchange — all fail at Armenia's market size: insufficient volume to bootstrap a self-service network, noise without curation, prohibitive infrastructure cost for programmatic.

The brokered model trades scale for concierge service. Advertisers explain their need once; the platform team does the legwork. Publishers receive curated, qualified leads from a single source instead of random inbound. Trust accrues to the platform, which is the strategic prerequisite for Phase 2 monetization through brokerage commission.

Timing rationale: Armenia's advertising ecosystem reached the critical mass of publishers and brands in 2026 to make aggregation economically rational. Earlier, fragmentation was natural; later, an established competitor would have captured the position.

## Project Classification

- **Project Type:** `saas_b2b` — multi-tenant B2B platform with dashboard, RBAC, workflow state machine.
- **Domain:** `general` — advertising marketplace. No regulated compliance burden (not HIPAA / PCI / KYC).
- **Complexity:** `medium` — multi-role permissions, Inquiry lifecycle, third-party integrations, verification. Above CRUD but below regulated-industry.
- **Project Context:** `brownfield` — restructuring `Advertising_Platform_TZ_v3.1.md` into BMAD-canonical PRD.

## Success Criteria

### User Success

**Advertiser:**

- Submit an inquiry on a listing within 3 clicks from the catalog page.
- Receive first response from the platform team within 4 business hours of submitting an inquiry.
- Confirm a deal without speaking to the publisher directly — all negotiation happens via the platform team.

**Publisher:**

- Create a listing in under 5 minutes after verification approval.
- Receive qualified, broker-curated inquiries via the platform team — not random inbound.
- Confirm or decline an inquiry via the same channel (chat or scheduled call).

**Platform team (Admin):**

- View all open inquiries in a single queue with SLA flags.
- Mediate an inquiry end-to-end (both chat threads + internal notes + status) from a single split-pane screen.
- Claim an unassigned inquiry with one click.

### Business Success

**3-month targets (MVP launch):**

- 30+ verified publishers.
- 100+ verified advertisers.
- 50+ inquiries handled.
- Median first-response time under 4 business hours.
- 10+ confirmed deals brokered.

**12-month targets (Post-MVP):**

- First brokerage commission collected (Phase 2 monetization launched).
- 100+ confirmed deals cumulative.
- 200+ verified publishers, 500+ verified advertisers.

### Technical Success

- Platform deployable to Hostinger Business Node.js + MySQL stack within free-tier budget cap (~$4/mo plan already paid; all other services on free tiers).
- ≥99% uptime during business hours, measured via external uptime monitoring (free tier).
- All pages load under 3 seconds for 95th-percentile users on broadband.
- Critical user paths (registration, inquiry submit, admin queue) have 0 unrecovered errors per 1000 sessions.
- Solo developer ships MVP in 3–4 months.

### Measurable Outcomes

| Outcome | Target | Measurement |
|---|---|---|
| Verified publishers | 30+ in 3 months | Admin verification queue completions |
| Verified advertisers | 100+ in 3 months | Admin verification queue completions |
| Total inquiries | 50+ in 3 months | Inquiry table count |
| First-response SLA | Median < 4 business hours | Inquiry created → first admin reply timestamp |
| Confirmed deals | 10+ in 3 months | Inquiry.status = CONFIRMED |
| Median inquiry handling | < 5 business days | Inquiry.createdAt → Inquiry.closedAt |
| Platform uptime | ≥99% business hours | External uptime monitoring |
| Page load p95 | < 3 seconds | Web vitals analytics |

## Product Scope

### MVP — Minimum Viable Product (Phase 1-4, weeks 1-16)

Authentication & onboarding (email + password + verification), company verification (manual admin approval), listings (no prices, dates only), browse + search + wishlist, inquiry flow with status lifecycle, third-party chat widget for both sides, voice calls off-platform with logging, notifications (in-app + email), full Super Admin panel (queue, detail split-pane, verification, user/company/listing management, taxonomy, audit log, analytics).

### Growth Features (Post-MVP, Phase 5)

Monetization (brokerage commissions), reviews/ratings, in-platform WebRTC voice/video, mobile-responsive polish, multi-language (RU/AM), featured publishers as paid placements, advertiser-side campaign analytics.

### Vision (Future)

Native mobile apps, in-platform contracts + e-signature, AI-assisted broker tooling (suggest publishers per inquiry, draft outreach, conversation summarization), self-service ad creative tools, programmatic bidding, expansion to additional CIS markets.

## User Journeys

### Journey 1 — Advertiser Happy Path: Anush books August radio slots for an energy drink launch

**Persona.** Anush, 32, Marketing Director at Yerevan Beverages. Launching a new energy drink ("Volt") in August 2026. Has a $50k Q3 campaign budget. Frustrated by cold-calling 12 different media operators individually for quotes. Wants to allocate spend across radio + web + in-video without managing 12 inboxes.

**Opening scene.** A colleague forwards her the platform link. She lands on the homepage at 9am Tuesday. Reads "Find your next ad slot. We handle the rest." Skeptical but interested. Clicks **Get started**.

**Rising action.** Three-step registration: personal info → email verification (6-digit code) → company info (Yerevan Beverages, food & beverage industry, target channels: radio, web banner, in-video). System reads: "Account submitted for verification. You can browse, but cannot submit inquiries until approved."

She browses while she waits. Filters: channel = radio, region = Yerevan, availability = August–September. Sees 8 publisher listings. Each shows availability dates and audience demographics but no prices.

Two hours later, an email arrives: "Account approved." She returns to a listing from Radio Van: "Morning Drive 7am–9am, August 1–31. Audience: 35k daily, 25–45 urban professionals." Clicks **Request Information**.

**Climax.** A short form asks: campaign goal, desired dates, budget range (optional, private), notes. She fills it: "Launch energy drink 'Volt'. August 5–31. Budget $8k. Want pricing options and creative deadlines." Submits.

A chat window opens — but the other party is "Mariam from Advertising Platform team," not Radio Van. System reads: "Inquiry submitted. We'll be in touch within 4 hours."

**Resolution.** Three hours later, Mariam responds in the chat: "Hi Anush, Radio Van's morning drive August 5–31 is $5,500 for 30 spots (one daily). Creative deadline July 28. I can reserve today. Want two alternatives to compare?" Anush accepts. Two days later, after one phone call with Mariam to clarify creative format, the deal is **Confirmed**. Anush logs it in her CRM. She never spoke to Radio Van directly.

**Capabilities revealed:** public catalog with filters, no-price listings, multi-step registration with email verification, inquiry form with optional private budget, embedded third-party chat widget on inquiry detail page, email notifications on approval and admin replies, inquiry status tracking, "my inquiries" dashboard.

---

### Journey 2 — Publisher Happy Path: Davit replaces cold inbound with one curated lead

**Persona.** Davit, 41, Sales Manager at Shant TV in Yerevan. Sells ad inventory for 12 years. Receives 40+ random inbound emails per week from brands he's never heard of, 70% of which don't match Shant TV's audience. Has stopped responding to anything not from a known agency.

**Opening scene.** His finance director forwards an article about the new aggregator. Davit signs up: three-step registration → manual verification → admin approves him the next morning.

**Rising action.** He builds Shant TV's profile — adds source channels: "Shant TV main", "Shant TV news", "Shant Premier League stream". Creates four listings: prime-time spots, news segments, late-night, and digital pre-roll. Each with availability windows for Q3 2026. No prices specified — the platform team handles negotiation. He sets each to **Active**, gets back to his real work. The platform sits passive.

**Climax.** Five days later, email lands: "New inquiry from Mariam (Advertising Platform team) about your morning drive August slot. Brand: Yerevan Beverages, launching new product. Budget signaled ~$5,500."

Davit opens the platform. The inquiry is in his **Incoming Inquiries** inbox. The chat thread is with Mariam — not Yerevan Beverages. Mariam writes: "Davit, Yerevan Beverages wants the morning drive slot but Shant TV has a stronger evening youth audience. Want me to pitch them the prime-time youth block instead? Better match for an energy drink." Davit replies: "Yes, pitch the evening block. I can do $6,800 for 30 spots across August + September."

**Resolution.** Within 24 hours Mariam returns: "They're interested. Confirming evening slot August 5 – September 5 at $6,500 with their requested creative." Davit accepts. Status: **Confirmed**. He never spoke directly to anyone at Yerevan Beverages, never chased a contract, never filtered cold inbound.

**Capabilities revealed:** publisher dashboard with My Listings + Incoming Inquiries, listing creation form with multi-channel selection + availability windows, listing status state machine (Draft / Active / Paused / Closed), embedded third-party chat widget on publisher side, listing analytics (views, inquiry counts), no direct advertiser-publisher chat, broker-mediated upsell capability.

---

### Journey 3 — Advertiser Edge Case (Negative): Karen loses momentum and bounces

**Persona.** Karen, 28, founder of a startup making vegan snacks. Heard about the platform from a meetup. Wants to test radio ads but is unsure about budgets. Easily distracted by competing priorities.

**Opening scene.** Karen registers as Advertiser on a Friday evening. Browses the catalog while waiting for verification. Sees a Radio Yerevan morning slot he loves. Clicks **Request Information**.

**Rising action.** System blocks: "Your company is pending verification. You can submit inquiries after approval." Clicks the tooltip: "Manual review by our team within 1 business day for fraud prevention. You'll get an email when approved." He's frustrated — wanted to act now — but accepts the wait.

**Climax.** Monday morning, his startup is still in the verification queue. His CFO drops a Slack: "We should focus on the trade show instead." Karen logs out and forgets the platform.

Wednesday, admin approves his account. Email lands. Karen ignores it.

**Resolution (negative).** Six weeks later, Karen sees a competitor's ad on radio. He searches "Armenia radio ads" and ends up on the platform again. Logs in. Dashboard shows "0 inquiries." Clicks the listing he originally wanted — marked "Closed — September 15 expired." He starts fresh on a different listing.

**Capabilities revealed:** clear verification-status messaging on blocked actions, accessible help tooltips, email triggers on approval, "my inquiries" dashboard as the landing page post-login, listing status visibility (Active / Closed / Paused), soft re-engagement signals (the listing he abandoned should show up in his history with status updates).

---

### Journey 4 — Admin Workflow: Mariam manages her morning queue

**Persona.** Mariam, 36, Senior Broker at Advertising Platform team, **Manager** sub-role. Handles 10–15 active inquiries simultaneously. Ex media planner at an agency. Speed and context-switching are her bread and butter.

**Opening scene.** 9am Tuesday. Mariam logs into `admin.advertising-platform.am` — separate URL from the main site. Authenticates with 2FA via her authenticator app.

**Rising action.** Admin dashboard loads: KPI cards (New inquiries today: 5, SLA-at-risk: 3, Pending verifications: 2, New signups today: 7, Median response time: 3h 12m), My Queue widget (5 inquiries assigned to her overnight, sorted by SLA urgency), Team Queue (3 unassigned New inquiries available to claim), and a recent activity feed showing platform events in real-time.

She clicks her My Queue. First item: Anush from Yerevan Beverages, inquiry on Radio Van morning drive slot. Mariam opens it.

**Climax.** The Inquiry Detail three-column split-pane loads:

- **Left:** advertiser profile card (Yerevan Beverages, verified, food & beverage industry, 1 total inquiry, contact phone, email), publisher profile card (Radio Van, verified, radio + web), listing card (morning drive, August 1–31), status: **New**, SLA timer: 1h 20m until breach.
- **Middle:** the chat thread with Anush — her first message visible.
- **Right:** the chat thread with Radio Van — empty; Mariam hasn't reached out yet.

Mariam uses a quick-response template: "Hi Anush, thanks for the inquiry. I'll check availability with Radio Van and get back to you by EOD." Sends via embedded chat widget. Switches to right column. Composes to Radio Van's contact: "Yerevan Beverages launching new energy drink in August. Wants morning drive slot, budget ~$8k, 30 spots. Available?"

Sets inquiry status to **Awaiting Publisher**. Adds an internal note (admin-only): "Anush mentioned new product launch — could upsell to prime-time TV slots if budget allows. Check with TV inventory after this one. @Aram, can you flag any Shant TV opportunities?" The @mention triggers an in-app notification to teammate Aram.

**Resolution.** Throughout the day Mariam handles 4 more inquiries with similar pattern. Three move to **Awaiting Publisher**, one to **Awaiting Advertiser** (Radio Van confirmed availability, waiting on Anush to accept), one closes as **Lost** (publisher unavailable for those dates). By 5pm her My Queue has dropped to 7. Two deals moved to **Confirmed**. She closes 3 internal notes, logs off.

**Capabilities revealed:** admin login at separate URL, mandatory 2FA via TOTP, admin dashboard with KPI cards + My Queue + Team Queue + activity feed, inquiry queue with filters (status, assignee, SLA, channel, industry), inquiry detail split-pane with three columns (context + two chat threads), quick-response templates, status state machine with transition guards, internal notes with @mentions and in-app notifications, embedded third-party chat on both sides, audit log of every admin action, SLA timer with breach flagging.

---

### Journey Requirements Summary

The four journeys reveal a coherent set of capability areas. Each is the input for Functional Requirements in Step 9 of this workflow.

| # | Capability area | Revealed by journey |
|---|---|---|
| 1 | Multi-step registration with email verification | All |
| 2 | Manual company verification by admin | 1, 2, 3 |
| 3 | Public catalog with channel/region/date filters | 1, 3 |
| 4 | Listings with availability dates and no prices | 1, 2 |
| 5 | Listing creation, edit, pause, archive (publisher) | 2 |
| 6 | Inquiry submission form (advertiser → admin) | 1, 3 |
| 7 | Embedded third-party chat widget (advertiser-side and publisher-side, isolated) | 1, 2, 4 |
| 8 | Inquiry status state machine (New → Confirmed/Lost/Cancelled) | All |
| 9 | Email notifications (verification, replies, status changes) | 1, 3 |
| 10 | Advertiser "My Inquiries" dashboard | 1, 3 |
| 11 | Publisher "Incoming Inquiries" inbox | 2 |
| 12 | Publisher listing analytics (views, inquiry counts) | 2 |
| 13 | Admin separate URL + mandatory 2FA | 4 |
| 14 | Admin dashboard (KPIs, My Queue, Team Queue, activity feed) | 4 |
| 15 | Inquiry detail split-pane (3 columns: context + two chat threads) | 4 |
| 16 | Quick-response templates for admins | 4 |
| 17 | Internal notes with @mentions + in-app notifications | 4 |
| 18 | Audit log of admin actions | 4 |
| 19 | SLA timer with breach flagging | 4 |
| 20 | Help tooltips on blocked actions (e.g., verification gate) | 3 |
| 21 | Listing status visibility to advertisers (Active / Closed / Paused) | 3 |
| 22 | Re-engagement signal post-verification | 3 |

## Domain-Specific Requirements

### Compliance & Regulatory

The advertising marketplace domain in Armenia carries no specific regulatory burden for MVP scope:

- **Not fintech:** No PCI-DSS, no KYC/AML, no banking compliance. Phase 1 has no payments on-platform. Phase 2 brokerage commissions can be invoiced off-platform.
- **Not healthcare:** No HIPAA, no medical data.
- **Not GovTech:** No Section 508 accessibility mandate, no FedRAMP. (WCAG AA is followed as best practice — see NFRs.)
- **Not edtech:** No COPPA/FERPA student data.
- **No GDPR pressure for MVP:** Geography limited to Armenia. Armenian Personal Data Protection Law applies but is permissive for B2B platforms with consent on signup.

### Technical Constraints

- **Data residency:** No constraint in MVP (Hostinger Business plan is sufficient).
- **Encryption in transit:** HTTPS via Let's Encrypt (default on Hostinger).
- **Password storage:** bcrypt hashing, minimum 10 rounds.
- **Audit logging:** Internal accountability requirement — every admin action recorded in `AuditEntry` table. Append-only.
- **Backup & disaster recovery:** Hostinger Business plan daily backups. RPO ≤ 24h, RTO ≤ 24h.

### Integration Requirements

- **Third-party chat provider** (provider TBD before Phase 3) — for advertiser↔admin and admin↔publisher conversations. Free tier required.
- **Resend** — transactional email.
- **Sentry** — error monitoring.
- **PostHog** (or Plausible) — product analytics.
- **GitHub → Hostinger Git deployment** — CI/CD path.

### Risk Mitigations

- **Verification trust:** Manual review by admin team catches obvious fraud at MVP scale (30 publishers / 100 advertisers in 3 months). Phase 2 may add automated KYC checks if volume scales.
- **Chat provider lock-in:** Platform stores only thread IDs from the chat provider — no message content. Migration cost to alternative provider is bounded to re-creating threads on the new platform; historical chats remain in the old provider until retention expires.

## Innovation & Novel Patterns

### Detected Innovation Areas

The product's distinctive bet is **inverted marketplace mechanics**: where most adtech marketplaces optimize for self-service scale (Google Ads, programmatic exchanges, Meta Ads Manager), this platform deliberately inserts a human broker between every advertiser-publisher pair. This is unusual in 2026 — the market has spent two decades automating ad transactions out of the human conversation. The product bets that for fragmented small markets like Armenia, returning to broker-mediated curation produces higher conversion and stronger network effects than self-service.

### Market Context & Competitive Landscape

**Direct competitors in Armenia:** None known. The local market today runs on:

- Individual publisher sales teams (cold inbound from brands).
- Boutique media agencies that aggregate manually via spreadsheets and phone calls.
- International programmatic ad exchanges (Google, Meta) for digital inventory only — no coverage of local TV/radio/outdoor/film placement.

**Indirect competitors:** Facebook Marketplace–style classifieds (no curation); LinkedIn cold outreach; agency intermediaries.

**Reference patterns from elsewhere:** Brokered marketplaces succeed in similarly fragmented niches — commercial real estate brokers, M&A boutiques, art and wine auctioneers, freight brokers. Shared signature: low transaction count, high per-deal value, opaque pricing, trust as a precondition. Adtech in Armenia fits this profile.

### Validation Approach

Validate the inverted model against the first 10 confirmed deals. Track:

- Post-deal advertiser satisfaction with broker mediation (target ≥ 70% prefer mediated over hypothetical self-service).
- Median time from first inquiry to confirmed deal (target < 5 business days).
- Median number of admin chat interventions per inquiry (target 4–8 — too few suggests the broker adds no value; too many suggests inefficiency).

### Risk Mitigation

If after the first 50 inquiries the data shows advertisers consistently prefer direct contact with publishers, evaluate adding a "request direct contact" mode in Phase 2. This would require fundamental rework of the data and authorization model and is treated as a vision-level pivot, not a quick fix.

## SaaS B2B Requirements

### Project-Type Overview

Multi-tenant B2B platform with role-based access control, workflow state machine, and embedded third-party integrations. Three primary user roles (Advertiser, Publisher, Super Admin) with four sub-roles inside Super Admin (Owner, Manager, Broker, Support). One user belongs to exactly one company; one company may act as Advertiser, Publisher, or both.

### Tenant Model

- **Tenant unit:** Company. All listings, inquiries, users, internal notes, and wishlists are scoped to a company.
- **Isolation:** Row-level application authorization. Single shared MySQL database with `companyId` foreign keys on every business entity. No physical multi-tenancy (separate schemas or databases).
- **Cross-tenant visibility:** Public catalog is cross-tenant by design (advertisers browse all publishers). Admin sees everything. Otherwise tenant-strict.

### RBAC Matrix

| Capability | Advertiser | Publisher | Admin: Owner | Admin: Manager | Admin: Broker | Admin: Support |
|---|---|---|---|---|---|---|
| Register account | ✓ | ✓ | — | — | — | — |
| Browse public catalog | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (read-only) |
| Submit inquiry | ✓ | — | — | — | — | — |
| Create / edit listing | — | ✓ | ✓ (on behalf) | ✓ (on behalf) | — | — |
| View own inquiries | ✓ | ✓ | ✓ (all) | ✓ (all) | ✓ (assigned) | ✓ (all, read-only) |
| Send chat message | ✓ (own side) | ✓ (own side) | ✓ (both sides) | ✓ (both sides) | ✓ (assigned) | — |
| Approve / reject verification | — | — | ✓ | ✓ | — | — |
| Edit taxonomy | — | — | ✓ | ✓ | — | — |
| Create / edit admin users | — | — | ✓ | — | — | — |
| View platform-wide analytics | — | — | ✓ | ✓ | ✓ (own only) | ✓ (read-only) |

### Subscription Tiers

- **MVP:** All accounts free. No tiering.
- **Phase 2:** Brokerage commission on confirmed deals. No subscription tiers — fee per transaction.
- **Phase 3 (Vision):** Featured-publisher paid placements as a separate monetization stream.

### Integration List

| Integration | Purpose | Free-Tier Limits |
|---|---|---|
| Third-party chat provider (TBD) | Advertiser↔Admin and Admin↔Publisher real-time chat | Must cover ~130 MAU at no cost |
| Resend | Transactional email | 3,000 emails/month free |
| Sentry | Error monitoring | 5,000 events/month free |
| PostHog | Product analytics | 1M events/month free |
| Hostinger MySQL | Database | Included in Business plan |
| Hostinger filesystem | Uploaded file storage | 50 GB on Business plan |

### Compliance Requirements

None externally mandated. Internal compliance:

- User consent capture at registration (Terms of Service + Privacy Policy acceptance, recorded with timestamp).
- Audit logging of admin actions (immutable).
- 2FA enforcement for admin accounts (TOTP via authenticator app).

### Implementation Considerations

- One developer, 16-week MVP target.
- Code structure favors fewer abstractions and more standard patterns.
- Static analysis (ESLint, TypeScript strict mode) + Playwright E2E for critical paths (registration, inquiry submit, admin queue) are acceptance criteria for MVP launch.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP approach:** Vertical slice — every role end-to-end. The MVP is NOT a horizontal slice (e.g., "advertisers only in MVP, publishers later"). Both sides + admin must work together because the value proposition (brokered marketplace) exists only when all three roles transact. A horizontal slice would be a non-functional product.

**Resource requirements:** Solo developer. 16-week timeline. Free-tier infrastructure cap.

### MVP Feature Set (Phase 1-4, weeks 1-16)

**Core user journeys supported in MVP:**

- Journey 1 (Advertiser happy path) — fully.
- Journey 2 (Publisher happy path) — fully.
- Journey 4 (Admin workflow) — fully.
- Journey 3 (Advertiser edge case) — partially: blocked-action tooltip, post-approval email, listing status visibility. Soft re-engagement (Slack-style nudges) deferred.

**Must-have capabilities:** All 22 capability areas from the Journey Requirements Summary table.

**Explicit cuts from MVP (deferred to Phase 2 or 3):**

- In-platform voice/video calls (Phase 2 — only Call log entries in MVP, no actual telephony).
- File uploads inside chat (deferred indefinitely — kept out-of-band).
- Reviews and ratings (Phase 2).
- Monetization / brokerage commissions (Phase 2).
- Native mobile apps (Phase 3 vision).
- Multi-language (Phase 2).
- Featured-publisher paid placements (Phase 3 vision).
- Advertiser-side campaign analytics dashboards (Phase 2).

### Post-MVP Features

**Phase 2 (months 5-8):**

- Brokerage commission on confirmed deals.
- Reviews and ratings.
- In-platform WebRTC voice/video calls.
- Mobile-responsive polish.
- Multi-language (Russian + Armenian).
- Featured-publisher paid placements.
- Advertiser analytics dashboards.

**Phase 3 / Vision (months 9+):**

- Native mobile apps (iOS + Android).
- In-platform contracts + e-signature.
- AI-assisted broker tooling (suggest publishers per inquiry, draft outreach copy, summarize conversation history).
- Self-service ad creative tools (templates, AI copy).
- Programmatic real-time bidding for predictable inventory.
- Expansion to additional CIS markets (Georgia, Belarus).

### Risk Mitigation Strategy

**Technical Risks**

| Risk | Trigger | Mitigation |
|---|---|---|
| Third-party chat provider free tier doesn't cover ~130 MAU | Provider evaluation in week 9 finds no fit | Defer chat by 1 week, ship MVP with email-only first contact, add embedded chat after first paid tier upgrade is justified by usage |
| Hostinger Node.js apps hit CPU/memory caps under SSR load | Production response times exceed 3s p95 | Front-load static marketing pages, prefer CSR for cabinet pages, escalate to higher Hostinger plan or VPS if Business plan caps prove insufficient |

**Market Risks**

| Risk | Trigger | Mitigation |
|---|---|---|
| Target metrics (30 publishers / 100 advertisers / 50 inquiries / 10 deals in 3 months) prove wildly optimistic | At week 24, traction below 50% of targets | Re-run discovery with Mary (Analyst) on actual user feedback before scaling investment |
| Advertisers reject the brokered model and want direct publisher contact | Post-deal advertiser satisfaction below 50% | Evaluate adding "request direct contact" mode in Phase 2 (treated as architectural pivot, not quick fix) |

**Resource Risks**

| Risk | Trigger | Mitigation |
|---|---|---|
| Solo dev burns out or misses 16-week target | Week-by-week checkpoint behind plan by > 1 week | Cut Phase 1 scope at checkpoints (week 4 / 8 / 12 / 16). Candidate cuts: verification queue automation, taxonomy editor, broadcast announcements, advanced filters |
| Free-tier services impose volume caps that block MVP scaling | Approaching cap on Resend / Sentry / PostHog | Re-evaluate at first paid-tier crossover (likely after Phase 2 monetization launches and revenue justifies it) |

## Functional Requirements

This list is the capability contract for the MVP. Any feature not listed here will not exist unless explicitly added.

### Authentication & Account Management

- **FR-001:** An unregistered visitor can register an account by selecting a primary role (Advertiser or Publisher), providing full name, email, phone number, password, and accepting Terms of Service and Privacy Policy.
- **FR-002:** A registered user can verify their email address using a 6-digit code delivered to their inbox.
- **FR-003:** A registering user can request a new verification code after 60 seconds from the previous code.
- **FR-004:** A logged-in user can log out of all sessions.
- **FR-005:** A registered user can log in using email and password.
- **FR-006:** A logged-in user is automatically logged out after a period of inactivity.
- **FR-007:** A user who has forgotten their password can request a password reset link delivered to their registered email.
- **FR-008:** A user can change their password from their account settings while logged in.

### Company Profile & Verification

- **FR-009:** A registered user can complete their company profile with legal name, tax ID / registration number, founding year, country, address, primary contact name and phone, and an optional logo upload.
- **FR-010:** A registered user can submit their company profile for verification.
- **FR-011:** An unverified user can browse the public catalog but cannot submit inquiries (Advertiser) or create listings (Publisher).
- **FR-012:** A user receives an email notification when their company verification status changes.
- **FR-013:** A user whose company verification was rejected can resubmit verification with updated information.
- **FR-014:** A logged-in user can edit their company profile after verification.

### Public Catalog & Discovery

- **FR-015:** Any visitor (logged in or not) can browse the public catalog of active publisher listings.
- **FR-016:** Any visitor can search the catalog by keyword across listing title, publisher name, and source channel name.
- **FR-017:** Any visitor can filter the catalog by channel type, industry, region, audience size range, and availability date range.
- **FR-018:** Any visitor can sort the catalog by newest or by soonest availability.
- **FR-019:** Any visitor can navigate the catalog via paginated results.
- **FR-020:** No listing displays a price publicly — only availability dates, channel details, and audience demographics.

### Listing Management (Publisher)

- **FR-021:** A verified publisher can create a listing with title, channel type, source channel, availability start and end dates, audience demographics, description, and optional attachments.
- **FR-022:** A publisher can edit any of their own listings.
- **FR-023:** A publisher can transition a listing through statuses: Draft → Active → Paused → Closed.
- **FR-024:** A publisher can view per-listing analytics including view count and inquiry count.
- **FR-025:** An admin can edit, unpublish, or flag any listing for review.

### Inquiry Submission & Lifecycle (Advertiser)

- **FR-026:** A verified advertiser can submit an inquiry on a specific listing by providing campaign goal, desired dates, optional private budget range, and free-text notes.
- **FR-027:** A verified advertiser can submit a general inquiry to a publisher not tied to a specific listing.
- **FR-028:** An advertiser can view all their inquiries in a "My Inquiries" dashboard with current status, last activity timestamp, and assigned admin name.
- **FR-029:** An inquiry follows a status state machine: New → Assigned → In Progress → Awaiting Publisher → Awaiting Advertiser → Confirmed → Closed (Won / Lost / Cancelled).
- **FR-030:** Each status transition is recorded with timestamp and actor in the inquiry's activity timeline.

### Chat & Communication

- **FR-031:** When an inquiry is created, the platform initialises two isolated chat threads with the third-party chat provider — one between the advertiser and admin, one between the admin and publisher.
- **FR-032:** An advertiser can send and receive messages with the platform team via an embedded chat widget on the inquiry detail page.
- **FR-033:** A publisher can send and receive messages with the platform team via an embedded chat widget on the inquiry detail page.
- **FR-034:** An advertiser cannot see the publisher-side chat thread; a publisher cannot see the advertiser-side chat thread.
- **FR-035:** An admin can see both chat threads side-by-side within the inquiry detail view.
- **FR-036:** The platform stores only chat thread identifiers from the provider — message content is owned by the provider.

### Voice Calls (off-platform with logging)

- **FR-037:** An admin can log a voice call against an inquiry, capturing date, duration, the party called (advertiser-side or publisher-side), and free-text notes.
- **FR-038:** The full Call log appears in the inquiry's activity timeline.

### Wishlist

- **FR-039:** A verified advertiser can save a listing or a publisher to their personal wishlist.
- **FR-040:** A verified advertiser can submit a new inquiry directly from a wishlist item.

### Notifications

- **FR-041:** The platform sends in-app notifications to users for: new message from the platform team, inquiry status change, verification result, listing approval or rejection.
- **FR-042:** The platform sends email digests to users: instant for critical events (verification result, status changes) and a daily summary for non-critical updates.
- **FR-043:** An admin receives in-app notifications for: new inquiries, new user signups, new verification requests, inquiries assigned to them, SLA breaches.
- **FR-044:** A user can view all their in-app notifications in a notifications drawer accessible from any screen.

### Admin Dashboard & Queue Management

- **FR-045:** An admin can log in via a separate URL (`admin.[domain]`) with mandatory two-factor authentication.
- **FR-046:** An admin session expires after a period of inactivity.
- **FR-047:** An admin sees a dashboard with: today's new inquiries count, active inquiries count, pending verifications count, today's signup count, median response time KPI, "My Queue" widget, "Team Queue" widget, recent activity feed, and pinned announcements.
- **FR-048:** An admin can view all inquiries in a paginated queue with columns: ID, Advertiser, Publisher, Listing, Status, Assigned Admin, Age, Last Activity, SLA flag.
- **FR-049:** An admin can filter the queue by status, assigned admin (including "unassigned"), channel type, industry, date range, and SLA-breached only.
- **FR-050:** An admin can save filter combinations as named views.
- **FR-051:** An admin can claim an unassigned inquiry with one action.
- **FR-052:** An admin can reassign an inquiry to a teammate.
- **FR-053:** An admin can change an inquiry's status from the queue without opening the inquiry detail.
- **FR-054:** An admin can perform bulk actions on multiple selected inquiries: assign to admin, close as Won/Lost/Cancelled.

### Inquiry Mediation (Admin)

- **FR-055:** An admin can open an inquiry in a three-column split-pane view: context panel (left), advertiser chat thread (middle), publisher chat thread (right).
- **FR-056:** An admin can send messages to both chat threads from the same screen.
- **FR-057:** An admin can use predefined quick-response templates when composing messages.
- **FR-058:** An admin can mark an inquiry as Confirmed / Lost / Cancelled with a captured reason.
- **FR-059:** An admin can add internal notes (admin-only visibility) on an inquiry.
- **FR-060:** An admin can @-mention teammates in internal notes, triggering an in-app notification to the mentioned admin.
- **FR-061:** An admin can view the full activity timeline of an inquiry: message events from the chat provider, status changes, calls, internal notes.

### Platform Administration

- **FR-062:** An Owner or Manager admin can manage industries: add, rename, archive.
- **FR-063:** An Owner or Manager admin can manage channel types: add, rename, archive.
- **FR-064:** An Owner or Manager admin can manage source channels (specific brand/channel names): add, rename, archive.
- **FR-065:** An Owner or Manager admin can manage regions (country / marz / city hierarchy).
- **FR-066:** An Owner or Manager admin can view, edit, suspend, or delete any user.
- **FR-067:** An Owner or Manager admin can reset a user's password (sends email link).
- **FR-068:** An Owner or Manager admin can impersonate a user in read-only mode for support purposes.
- **FR-069:** An Owner or Manager admin can view, edit, or unpublish any company.
- **FR-070:** An Owner admin can create, edit, or disable admin user accounts.
- **FR-071:** An Owner admin can assign admin sub-roles (Owner, Manager, Broker, Support).
- **FR-072:** An Owner or Manager admin can curate the homepage featured-publishers spotlight via drag-and-drop ordering with date windows.
- **FR-073:** An Owner or Manager admin can publish broadcast announcements (top-of-page banners) to All users / Advertisers / Publishers / specific user lists, with schedule windows.

### Reporting, Analytics & Audit

- **FR-074:** An admin can view the immutable audit log of every admin action, filterable by admin, action type, entity type, and date range.
- **FR-075:** An admin can view platform-wide analytics with a date-range picker: daily/weekly/monthly active users, total signups by role, inquiries by stage and channel, conversion funnel from catalog view to confirmed deal, admin response-time performance, top publishers and advertisers by activity, and search insights including zero-result searches.
- **FR-076:** An admin can export any analytics view to CSV.

### File Storage & Uploads

- **FR-077:** A user can upload a company logo to their company profile.
- **FR-078:** A user can upload supporting documents (business license, brand guidelines) to a verification request.
- **FR-079:** A publisher can upload optional attachments (pitch deck, samples) to a listing.
- **FR-080:** File uploads are restricted to a documented maximum size and MIME-type allowlist (specific limits defined in NFRs).

## Non-Functional Requirements

All NFRs follow the template: "The system shall [criterion] [condition] [measurement method]". Each is measurable and testable.

### Performance

- **NFR-001:** Marketing pages render under 2s p95 on broadband (50 Mbps+) measured via web vitals (Largest Contentful Paint).
- **NFR-002:** Cabinet pages (advertiser, publisher) render under 3s p95 on broadband measured via web vitals.
- **NFR-003:** Admin queue and inquiry detail pages render under 3s p95 measured via web vitals.
- **NFR-004:** Read API endpoints (queue, list, detail) complete under 500ms p95 measured by Sentry performance monitoring.
- **NFR-005:** Write API endpoints (submit inquiry, change status, send message) complete under 1s p95 measured by Sentry.
- **NFR-006:** Email delivery (verification, notifications) initiated within 30s of trigger event measured by Resend delivery webhooks.

### Availability

- **NFR-007:** The platform maintains ≥99% uptime during business hours (9am–9pm UTC+4 Yerevan time) measured by external uptime monitor.
- **NFR-008:** The platform maintains ≥98% overall uptime including off-hours and planned maintenance measured by external uptime monitor.
- **NFR-009:** Database backups run daily, with the most recent backup no older than 24 hours measured by Hostinger backup logs.
- **NFR-010:** Disaster recovery targets are RPO ≤24h and RTO ≤24h measured by documented recovery procedure with annual rehearsal.

### Security

- **NFR-011:** All HTTP traffic redirects to HTTPS using TLS 1.2 or newer measured by SSL Labs scan (≥A grade).
- **NFR-012:** User passwords are stored as bcrypt hashes with ≥10 rounds measured by code review.
- **NFR-013:** Admin authentication requires two-factor authentication via TOTP measured by code review and admin onboarding checklist.
- **NFR-014:** Authentication endpoints enforce rate limiting at 10 attempts per IP per 5 minutes measured by application request logs.
- **NFR-015:** Inquiry submission enforces rate limiting at 20 inquiries per advertiser account per hour measured by application request logs.
- **NFR-016:** All form inputs are validated server-side via Zod schemas measured by code review.
- **NFR-017:** All admin actions are recorded immutably in the AuditEntry table measured by audit log review.
- **NFR-018:** A regular user's session auto-expires after 30 minutes of inactivity measured by code review and manual QA.
- **NFR-019:** An admin's session auto-expires after 1 hour of inactivity measured by code review and manual QA.
- **NFR-020:** Email verification codes are 6 digits, expire after 10 minutes, and are resendable after a 60-second cooldown measured by code review.
- **NFR-021:** Password reset links expire after 24 hours and are single-use measured by code review.

### Scalability

- **NFR-022:** The platform supports up to 1,000 concurrent user sessions on the Hostinger Business plan measured by load testing before launch.
- **NFR-023:** Database queries on critical paths (catalog browse, inquiry queue) complete under 200ms p95 with up to 100,000 rows per table measured by EXPLAIN ANALYZE.
- **NFR-024:** File storage maintains ≥40 GB free capacity (out of 50 GB Hostinger Business plan) measured by disk-usage monitoring with alerts at 80% utilization.

### Reliability

- **NFR-025:** Critical user paths (registration, inquiry submit, admin queue claim) maintain <1 unrecovered error per 1,000 sessions measured by Sentry.
- **NFR-026:** Background jobs (email send, notification dispatch) retry on failure with exponential backoff up to 3 attempts measured by code review.

### Data Integrity

- **NFR-027:** All entity timestamps (createdAt, updatedAt) are recorded in UTC measured by code review and database inspection.
- **NFR-028:** All foreign-key relationships specify explicit onDelete behavior (Cascade or Restrict) measured by Prisma schema review.
- **NFR-029:** The AuditEntry table is append-only at the application layer — no UPDATE or DELETE operations are exposed in code measured by code review.

### File Uploads

- **NFR-030:** File uploads are limited to 10 MB per file with MIME-type allowlist of JPG, PNG, WEBP, PDF measured by upload handler tests.
- **NFR-031:** Private file downloads require an authenticated session and entity-level authorization check measured by penetration test of the `/api/files` endpoint.

### Accessibility & Usability

- **NFR-032:** All interactive elements display a visible focus ring (≥1.5px) measured by manual accessibility audit.
- **NFR-033:** Contrast ratios meet WCAG 2.1 AA: 4.5:1 for body text, 3:1 for large text measured by Lighthouse accessibility score ≥90.
- **NFR-034:** Animations respect the `prefers-reduced-motion` user preference measured by manual QA.
- **NFR-035:** Status indicators include a text label or icon in addition to color measured by design review.

### Internationalization

- **NFR-036:** All UI copy, error messages, and email templates are in English at launch measured by translation file inspection (only `en` locale populated).
- **NFR-037:** The Inter font subset bundled in the platform supports Latin, Cyrillic, and Armenian glyphs measured by font subset inspection (future-language readiness for Phase 2 RU/AM).

### Maintainability

- **NFR-038:** All production code passes ESLint with the project rule set measured by CI lint stage (must be green to merge).
- **NFR-039:** All production code passes TypeScript strict mode (no implicit `any`, strict null checks) measured by CI type-check stage.
- **NFR-040:** Playwright E2E tests cover the three critical paths (registration → verification, inquiry submit, admin queue claim → status change) measured by test report attached to each release.

### Monitoring

- **NFR-041:** Production errors are captured in Sentry with stack traces and session context measured by Sentry inbox.
- **NFR-042:** Product events (page views, inquiry submissions, status changes) are captured in PostHog measured by PostHog dashboard.

### Browser Compatibility

- **NFR-043:** The platform is functional on the latest two versions of Chrome, Firefox, Safari, and Edge on desktop measured by manual QA per release.
- **NFR-044:** The platform is functional for read-only browsing on iOS Safari and Chrome on Android (latest versions); transaction flows are not optimized for mobile in MVP measured by manual QA per release.

---

## Document Status

**PRD Complete.** This document is the capability contract for the Advertising Platform MVP. It has been built through BMAD CP workflow steps 1 through 12.

**Next artifacts in the BMAD chain:**

1. **Architecture document** (`architecture.md`) — derived from this PRD + the stack decisions in `Advertising_Platform_TZ_v3.1.md` Section 11 and the conventions in `Claude_Code_Kickoff.md` `CLAUDE.md`. Owner: Winston (BMAD architect).
2. **UX Design document** (`ux-design.md`) — derived from User Journeys + the Modern Dark brand system in `Advertising_Platform_TZ_v3.1.md` Section 15. Owner: Sally (BMAD UX designer).
3. **PRD Validation report** — run `bmad-validate-prd` on this PRD. Expected: Pass on density, format, and measurability. May still flag innovation/domain-compliance as soft signals.
4. **Epics & Stories** (`epics-and-stories.md`) — derived from this PRD's FRs and the architecture + UX once those exist. Owner: John (this skill, via `bmad-create-epics-and-stories`).
5. **Implementation** — Amelia (BMAD developer) consumes epics and stories with TDD discipline.

**Traceability:**

- Vision → Success Criteria → User Journeys → Functional Requirements → (downstream Epics & Stories).
- Every FR traces back to at least one user journey or one operational requirement from Section 9 of the source TZ.
- All NFRs are measurable with documented test methods.
