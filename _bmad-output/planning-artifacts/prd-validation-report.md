---
validationTarget: 'Advertising_Platform_TZ_v3.1.md'
validationDate: '2026-05-13'
inputDocuments:
  - 'Advertising_Platform_TZ_v3.1.md'
  - 'Claude_Code_Kickoff.md'
validationStepsCompleted:
  - 'step-v-01-discovery'
  - 'step-v-02-format-detection'
  - 'step-v-03-density-validation'
  - 'step-v-04-brief-coverage-validation'
  - 'step-v-05-measurability-validation'
formatClassification: 'BMAD Variant'
measurabilitySeverity: 'Critical'
coreSectionsPresent: 4
coreSectionsTotal: 6
densitySeverity: 'Pass'
densityViolations: 0
validationStatus: TERMINATED_EARLY
terminationReason: 'After step 5, validation surfaced fundamental finding that the TZ is not BMAD-canonical PRD (mixes PRD+Architecture+UX). User chose puristский (BMAD canonical) path — restructure TZ into separate prd.md / architecture.md / ux-design.md before continuing validation. Steps 6–13 deferred until restructure complete; new validation will run against the clean prd.md.'
validator: 'John (PM)'
---

# PRD Validation Report

**PRD Being Validated:** `Advertising_Platform_TZ_v3.1.md`
**Validation Date:** 2026-05-13
**Validator:** John (Product Manager)
**Mode:** PRD-only validation (no frontmatter inputDocuments in PRD)

## Input Documents

- **Primary PRD:** `Advertising_Platform_TZ_v3.1.md` — Technical Specification v3.1 (Hostinger stack, free services only, chat as third-party). ~876 lines of markdown.
- **Reference:** `Claude_Code_Kickoff.md` — Bootstrap document including embedded `CLAUDE.md` content (brand palette, tone-of-voice, tech conventions, design system).

## Validation Findings

### Step 2 — Format Detection

**PRD Structure (## Level 2 headers):**

1. What changed from v3.0
2. 1. Executive Summary
3. 2. Project Vision & Goals
4. 3. User Roles & Permissions
5. 4. Core Model — How the Broker Flow Works
6. 5. Ad Channel Taxonomy
7. 6. User Flows
8. 7. Screen / Page Inventory
9. 8. Functional Requirements
10. 9. Super Admin Panel — Detailed Specification
11. 10. Data Model (Prisma + MySQL)
12. 11. Technical Recommendations — Hostinger stack
13. 12. Roadmap
14. 13. Approved Decisions Log
15. 14. Gap Analysis — What Still Needs Design Work
16. 15. Brand & Visual System
17. 16. Appendix

**BMAD Core Sections Present:**

- Executive Summary: ✅ Present (`## 1. Executive Summary`)
- Success Criteria: ✅ Present (`## 2. Project Vision & Goals` — Section 2.3 Success Metrics)
- Product Scope: ❌ Missing (Scope info exists as `### 1.1 Scope of MVP` at H3 level, not L2)
- User Journeys: ✅ Present (`## 6. User Flows`)
- Functional Requirements: ✅ Present (`## 8. Functional Requirements`)
- Non-Functional Requirements: ❌ Missing (NFR-style content scattered in `## 11. Technical Recommendations` and `## 8` security/SLA, not consolidated)

**Format Classification:** BMAD Variant
**Core Sections Present:** 4/6

**Observations:**
- TZ has rich content beyond core BMAD sections (Data Model, Roadmap, Decisions Log, Brand System) — these add value but are NOT BMAD PRD canon and may belong in separate downstream artifacts (Architecture doc, UX doc).
- Missing "Product Scope" as L2 section is a structural issue — scope content exists but is buried in Executive Summary as H3.
- Missing dedicated "Non-Functional Requirements" L2 section is a real gap. NFRs need consolidation for downstream Architecture work.
- "Technical Recommendations" section (## 11) is **implementation leakage** — tech stack belongs in Architecture doc, not PRD. Will be flagged in step-v-07.

### Step 3 — Information Density Validation

**Anti-Pattern Violations:**

- **Conversational Filler:** 0 occurrences (scanned: "in order to", "for the purpose of", "with regard to", "it is important to note", "the system will allow")
- **Wordy Phrases:** 0 occurrences (scanned: "due to the fact that", "in the event of", "at this point in time", "in a manner that")
- **Redundant Phrases:** 0 occurrences (scanned: "future plans", "past history", "absolutely essential", "completely finish")

**Total Violations:** 0
**Severity Assessment:** ✅ Pass

**Recommendation:** PRD demonstrates excellent information density. Language is direct, precise, no filler. This is one of the strongest aspects of the document.

### Step 4 — Product Brief Coverage

**Status:** N/A — No standalone Product Brief was provided as input. Validation proceeded with PRD + reference docs only.

**Note:** The TZ itself contains brief-like content in Sections 1–2 (Executive Summary, Vision & Goals). For BMAD-correct flow downstream, a separate Product Brief is not strictly required when the PRD already embeds vision and target-user content.

### Step 5 — Measurability Validation

#### Functional Requirements

**Total FRs Analyzed:** Section 8 contains 9 sub-sections (8.1–8.9), each describing a feature area with bullet-point capabilities. Estimated ~50 individual capability bullets across the section. **NONE are formatted as discrete numbered FRs.**

**Format Violations:** ~50 (~100% of FR-like statements)

The TZ uses prose/bullet-point feature descriptions instead of "[Actor] can [capability]" format. Example actual content (line 277):
> "Email + password registration."
> "Email verification via 6-digit code (10-minute expiry, resendable after 60 seconds) — sent via Resend."

BMAD-correct format would be:
> "FR-001: An unregistered visitor can register an account by providing email and password. Verification email is delivered within 60 seconds."
> "FR-002: A registering user can verify their email via a 6-digit code valid for 10 minutes, resendable after 60 seconds."

**Subjective Adjectives Found:** 7 occurrences (lines 180, 338, 378, 452, 457, 460, 491)

- Lines 452, 457, 460, 491 are in **"Why" justification columns** of the tech stack table (`## 11. Technical Recommendations`) — not in actual FRs. Not blocking.
- Line 180 ("quick inquiry form"), 338 ("Quick 'Submit Inquiry'"), 378 ("Quick actions") — descriptive UI language in user flows, not formal FRs. Soft violation.

**Vague Quantifiers Found:** 6 occurrences, 2 actual issues

- Line 145: "Publishers list inventory across multiple channel types" — channel types enumerated in Section 5, but the FR-level statement uses "multiple" instead of citing the count or list. Soft violation.
- Line 379: "assign multiple to admin, close multiple as won/lost/cancelled" — could be "a selection" with bounds.
- Lines 421, 422, 424, 426, 432 — false positives. "many" appears in Prisma relationship descriptions (one-to-many, many-to-many) which are standard ORM terminology, not vague quantifiers.

**Implementation Leakage:** 62 occurrences across 17 lines of named technologies (Next.js, Prisma, MySQL, NextAuth, bcrypt, Resend, Hostinger, Tailwind, TypeScript, GitHub, Sentry, PostHog, shadcn, Motion, GSAP, Inter, Pusher, cuid, FULLTEXT).

**Concentration:**
- ~80% in `## 11. Technical Recommendations` — this entire section is Architecture doc content, not PRD content.
- ~15% in `## 10. Data Model (Prisma + MySQL)` — this is also Architecture content.
- ~5% in `## 8. Functional Requirements` itself — e.g., "Real-time messaging via WebSocket integration" (line 295), "MySQL FULLTEXT INDEX" (line 282), "via Resend" (line 263).

**FR Violations Total:** Significant (Critical severity)

#### Non-Functional Requirements

**Total NFRs Analyzed:** No dedicated NFR section exists. NFR-style content is scattered:

| Location | NFR-style content | Measurable? |
|---|---|---|
| Section 2.3 | "Median first-response time under 4 business hours" | ✅ Yes |
| Section 2.3 | "30+ verified publishers", "100+ verified advertisers", "50+ inquiries" | ✅ Yes |
| Section 8.1 | "Email verification 10-minute expiry, resendable after 60s", "Auto-logout after 30 min inactivity" | ✅ Yes |
| Section 8.7 | "SLA breach if inquiry stale > 24h" | ✅ Yes |
| Section 9.1 | "Admin session auto-expires after 1 hour", "2FA mandatory for admins" | ✅ Yes / ⚠️ method unspecified |
| Section 11.3 | "HTTPS everywhere", "password hashing via bcrypt", "rate limiting" | ❌ No metrics |
| Section 11.4 | "99% uptime in MVP" | ✅ Yes |
| Section 8 | "File upload limit 10 MB, MIME allowlist jpg/png/webp/pdf" | ✅ Yes |

**Missing Metrics:** ~5 NFR-style statements lack measurement criteria (mostly in Section 11.3 security essentials).

**Incomplete Template:** All NFRs are missing the "as measured by X" portion of the BMAD NFR template.

**Missing Context:** Most NFRs have reasonable context (why it matters).

**NFR Violations Total:** Moderate

#### Overall Assessment

**Total Requirements:** ~50 FR-equivalents + ~10 NFR-equivalents = ~60 statements requiring measurability.

**Total Violations:** ~50 FR format violations + ~5 NFR metric gaps + 62 implementation leakage = significant.

**Severity:** ⚠️ **Critical**

**Recommendation:** The TZ functions well as a comprehensive product+architecture spec, but is NOT a BMAD-canonical PRD. Two paths forward:

1. **Restructure path (BMAD-pure):** Split TZ into three docs — clean PRD (capability-only, no tech), Architecture doc (Sections 10, 11, parts of 8), UX doc (Sections 6, 7, 15). Effort: 1–2 days. Yields highest downstream quality.
2. **Pragmatic path:** Keep TZ as-is, treat it as a "PRD+Architecture+UX combined" working spec. Skip BMAD's separation discipline. Effort: 0 days. Risk: downstream agents (Sally, Winston, Amelia) will get mixed signals and may need clarification per task.

Decision deferred to Step 13 (final report).

